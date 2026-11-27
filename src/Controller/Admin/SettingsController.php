<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Controller\Admin;

use Scale\VideoOptimizerBundle\Api\VideoOptimizerClient;
use Scale\VideoOptimizerBundle\Api\VideoOptimizerException;
use Doctrine\DBAL\Exception\TableNotFoundException;
use Scale\VideoOptimizerBundle\Controller\WebhookController;
use Scale\VideoOptimizerBundle\Service\SettingsManager;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Contracts\Cache\CacheInterface;

/**
 * Read/write the organization-wide VideoOptimizer settings. The token is write-only:
 * it is never returned to the browser, only its "configured" state.
 */
class SettingsController
{
    public function __construct(
        private SettingsManager $settingsManager,
        private VideoOptimizerClient $client,
        private ?CacheInterface $cache = null,
    ) {
    }

    public function get(?Request $request = null): JsonResponse
    {
        return new JsonResponse([
            'configured' => $this->settingsManager->isConfigured(),
            'defaultLibraryId' => $this->settingsManager->getDefaultLibraryId(),
            'defaultPlayer' => $this->settingsManager->getDefaultPlayer(),
            // The secret itself is write-only, like the token.
            'webhookConfigured' => $this->settingsManager->isWebhookConfigured(),
            'webhookUrl' => (null !== $request ? $request->getSchemeAndHttpHost() : '') . '/_videooptimizer/webhook',
            'webhookLastDelivery' => $this->lastWebhookDelivery(),
        ]);
    }

    public function put(Request $request): JsonResponse
    {
        $payload = json_decode($request->getContent(), true);
        if (!\is_array($payload)) {
            return new JsonResponse(['message' => 'Invalid payload.'], 400);
        }

        $defaultPlayer = $payload['defaultPlayer'] ?? null;
        if (!\is_string($defaultPlayer) || !\in_array($defaultPlayer, ['hosted', 'native'], true)) {
            $defaultPlayer = null;
        }

        $this->settingsManager->save(
            \is_string($payload['token'] ?? null) ? $payload['token'] : null,
            \is_string($payload['defaultLibraryId'] ?? null) ? $payload['defaultLibraryId'] : null,
            $defaultPlayer,
        );

        if (\is_string($payload['webhookSecret'] ?? null) && '' !== trim($payload['webhookSecret'])) {
            try {
                $this->settingsManager->saveWebhookSecret($payload['webhookSecret']);
            } catch (TableNotFoundException) {
                return new JsonResponse([
                    'message' => 'The webhook table does not exist yet. Run "bin/adminconsole scale:videooptimizer:install" (or a schema update) and save again.',
                    'code' => 'webhook_table_missing',
                ], 409);
            }
        }

        return $this->get($request);
    }

    /**
     * Clears the stored webhook secret: the endpoint then answers 503 again.
     */
    public function deleteWebhookSecret(?Request $request = null): JsonResponse
    {
        $this->settingsManager->clearWebhookSecret();

        return $this->get($request);
    }

    /**
     * Clears the stored API token (leaves the default library/player untouched).
     */
    public function deleteToken(?Request $request = null): JsonResponse
    {
        $this->settingsManager->clearToken();

        return $this->get($request);
    }

    /**
     * Verifies the stored token by calling the VideoOptimizer API.
     */
    public function test(): JsonResponse
    {
        try {
            $libraries = $this->client->listLibraries();
        } catch (VideoOptimizerException $e) {
            $described = ApiErrorResponse::describe($e);

            return new JsonResponse(['ok' => false] + $described['body'], 200);
        }

        return new JsonResponse(['ok' => true, 'libraryCount' => \count($libraries)]);
    }

    /**
     * @return array{event: string, time: int}|null
     */
    private function lastWebhookDelivery(): ?array
    {
        if (null === $this->cache) {
            return null;
        }

        try {
            /** @var mixed $last */
            $last = $this->cache->get(WebhookController::LAST_DELIVERY_KEY, static function (\Symfony\Contracts\Cache\ItemInterface $item, bool &$save): mixed {
                $save = false;

                return null;
            });
        } catch (\Throwable) {
            return null;
        }

        return \is_array($last) && \is_string($last['event'] ?? null) && \is_int($last['time'] ?? null) ? ['event' => $last['event'], 'time' => $last['time']] : null;
    }
}
