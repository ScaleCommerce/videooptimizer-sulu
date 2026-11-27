<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Controller;

use Psr\Log\LoggerInterface;
use Scale\VideoOptimizerBundle\Service\SettingsManager;
use Scale\VideoOptimizerBundle\Service\VideoOptimizerEmbedResolver;
use Sulu\Bundle\HttpCacheBundle\Cache\CacheManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;

/**
 * Receiver for VideoOptimizer webhooks: `POST /_videooptimizer/webhook` on the website.
 *
 * Create the webhook in the VideoOptimizer app (Integrations > Webhooks) and save its signing secret under
 * VideoOptimizer > Settings. Without a secret the endpoint answers 503 (fail closed).
 *
 * Headers: X-VideoOptimizer-Timestamp, X-VideoOptimizer-Signature (`sha256=` + hex HMAC-SHA256 of
 * "{timestamp}.{rawBody}"), X-VideoOptimizer-Delivery-Id. Deliveries older than five minutes are rejected (401),
 * retries and replays are acknowledged once (kept 24 h) and bodies above 1 MiB are refused (413).
 *
 * `video.ready` and `video.failed` (the events the API sends) drop the cached embed data of the video and
 * invalidate the cached pages that showed it (tag = the video UUID); `webhook.test` answers {ok:true}.
 */
class WebhookController
{
    public const TOLERANCE = 300;
    public const MAX_BODY = 1048576;
    public const DEDUPE_LIFETIME = 86400;
    public const LAST_DELIVERY_KEY = 'vo_webhook_last';

    private const VIDEO_EVENTS = ['video.ready', 'video.failed'];

    public function __construct(
        private SettingsManager $settingsManager,
        private VideoOptimizerEmbedResolver $embedResolver,
        private CacheInterface $cache,
        private ?CacheManagerInterface $cacheManager = null,
        private ?LoggerInterface $logger = null,
    ) {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $secret = $this->settingsManager->getWebhookSecret();
        if (null === $secret || '' === $secret) {
            return $this->json(['error' => 'Webhook secret not configured.'], 503);
        }

        // Refuse by the declared size first: the body is not even read.
        $length = $request->headers->get('Content-Length');
        if (null !== $length && ctype_digit($length) && (int) $length > self::MAX_BODY) {
            return $this->json(['error' => 'Payload too large.'], 413);
        }
        $raw = $request->getContent();
        if (\strlen($raw) > self::MAX_BODY) {
            return $this->json(['error' => 'Payload too large.'], 413);
        }

        $timestamp = (string) $request->headers->get('X-VideoOptimizer-Timestamp', '');
        $signature = (string) $request->headers->get('X-VideoOptimizer-Signature', '');
        if (!self::verify($secret, $timestamp, $raw, $signature, time())) {
            // notice, not warning: anyone can POST here, so this must not be a cheap way to flood the log
            $this->logger?->notice('VideoOptimizer webhook rejected: invalid signature or timestamp.');

            return $this->json(['error' => 'Invalid signature.'], 401);
        }

        // Dedupe on the signed part (timestamp + signature) as well as on the unsigned delivery id: a captured
        // request replayed inside the window with a new delivery id is still recognised.
        // Dedupe on the signed part (timestamp + signature) first: a captured request replayed inside the
        // window with a new delivery id is a duplicate and must not claim that id. Then the delivery id.
        if (!$this->claim('vo_wh_sig_' . hash('sha256', $timestamp . '.' . $signature))) {
            return $this->json(['duplicate' => true]);
        }
        $delivery = (string) preg_replace('/[^A-Za-z0-9_-]/', '', (string) $request->headers->get('X-VideoOptimizer-Delivery-Id', ''));
        if ('' !== $delivery && !$this->claim('vo_wh_' . substr(md5($delivery), 0, 32))) {
            return $this->json(['duplicate' => true]);
        }

        $payload = json_decode($raw, true);
        $event = \is_array($payload) && \is_string($payload['event'] ?? null) ? $payload['event'] : '';
        $data = \is_array($payload) && \is_array($payload['data'] ?? null) ? $payload['data'] : [];
        $this->rememberDelivery($event);

        if ('webhook.test' === $event) {
            return $this->json(['ok' => true]);
        }

        $flushed = false;
        $uuid = \is_string($data['uuid'] ?? null) ? $data['uuid'] : '';
        if (\in_array($event, self::VIDEO_EVENTS, true) && 1 === preg_match('/^[0-9a-fA-F-]{8,64}$/', $uuid)) {
            $this->embedResolver->forget($uuid);
            try {
                $this->cacheManager?->invalidateReference('video_optimizer', $uuid);
            } catch (\Throwable $e) {
                $this->logger?->warning('VideoOptimizer webhook: page cache invalidation failed.', ['uuid' => $uuid, 'error' => $e->getMessage()]);
            }
            $flushed = true;
        }

        $this->logger?->info('VideoOptimizer webhook processed.', ['event' => '' !== $event ? $event : 'unknown', 'uuid' => $uuid, 'delivery' => $delivery, 'flushed' => $flushed]);

        return $this->json(['received' => true, 'flushed' => $flushed]);
    }

    /**
     * `sha256=` + hex(HMAC-SHA256(secret, "{timestamp}.{rawBody}")) within the replay window.
     */
    public static function verify(string $secret, string $timestamp, string $rawBody, string $signature, int $now): bool
    {
        if ('' === $secret || '' === $timestamp || !ctype_digit($timestamp) || abs($now - (int) $timestamp) > self::TOLERANCE) {
            return false;
        }

        return hash_equals('sha256=' . hash_hmac('sha256', $timestamp . '.' . $rawBody, $secret), $signature);
    }

    /**
     * Marks a key as seen; true only for the first caller within the dedupe window.
     */
    private function claim(string $key): bool
    {
        $new = false;
        $this->cache->get($key, static function (ItemInterface $item) use (&$new): int {
            $new = true;
            $item->expiresAfter(self::DEDUPE_LIFETIME);

            return 1;
        });

        return $new;
    }

    private function rememberDelivery(string $event): void
    {
        try {
            $this->cache->delete(self::LAST_DELIVERY_KEY);
            $this->cache->get(self::LAST_DELIVERY_KEY, static fn (): array => ['event' => '' !== $event ? $event : 'unknown', 'time' => time()]);
        } catch (\Throwable) {
            // purely informational
        }
    }

    /**
     * @param array<string, mixed> $body
     */
    private function json(array $body, int $status = 200): JsonResponse
    {
        return new JsonResponse($body, $status, ['Cache-Control' => 'no-store']);
    }
}
