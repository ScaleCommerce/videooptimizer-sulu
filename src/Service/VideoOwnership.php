<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Service;

use Scale\VideoOptimizerBundle\Api\VideoOptimizerClient;
use Scale\VideoOptimizerBundle\Api\VideoOptimizerException;
use Sulu\Bundle\HttpCacheBundle\ReferenceStore\ReferenceStoreInterface;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;

/**
 * Decides whether a video named in a URL (`?vo_video=`) may be shown: the public embed would play any video of
 * any organization, so the uuid is checked with the site's own token (`GET /videos/{uuid}` answers 404 for
 * videos of other organizations and unknown ones) and, when the block names a library, against its membership.
 * Until a video is verified nothing about it (title, poster, JSON-LD) is rendered.
 */
class VideoOwnership
{
    public const OK = 'ok';
    public const MISSING = 'missing';
    public const UNAVAILABLE = 'unavailable';
    /** Internal: owned but not ready yet; check() reports it as unavailable. */
    private const PENDING = 'pending';

    /** Verified, ready videos are remembered as long as embed data is. */
    private const TTL_OK = 3600;
    /** Unknown and foreign videos, so a guessed uuid costs one API call per five minutes at most. */
    private const TTL_MISSING = 300;
    /** Videos that are not ready yet. */
    private const TTL_PENDING = 60;

    /** New (uncached) uuids that may be looked up per minute, site-wide; beyond that: not found, no API call. */
    public const MAX_NEW_PER_MINUTE = 30;

    public function __construct(
        private VideoOptimizerClient $client,
        private CacheInterface $cache,
        private ?EmbedRenderState $renderState = null,
        private ?SettingsManager $settings = null,
        private ?ReferenceStoreInterface $referenceStore = null,
    ) {
    }

    /**
     * Drops the remembered verdict of a video (webhook, change or deletion in the admin).
     */
    public function forget(string $uuid): void
    {
        try {
            $this->cache->delete($this->key($uuid));
        } catch (\Throwable) {
            // Best effort: the verdict expires on its own.
        }
    }

    /**
     * Verdicts belong to the token that was used: a changed token never reuses them.
     */
    private function key(string $uuid): string
    {
        $token = null === $this->settings ? null : $this->settings->getApiToken();

        return 'vo_own_v1_' . substr(sha1((string) $token), 0, 12) . '_' . $uuid;
    }

    /**
     * @return string one of OK, MISSING, UNAVAILABLE
     */
    public function check(string $uuid, ?string $libraryId = null): string
    {
        $uuid = VideoListProvider::uuid($uuid);
        if (null === $uuid) {
            return self::MISSING;
        }
        $library = null;
        if (null !== $libraryId && '' !== trim($libraryId)) {
            $library = VideoListProvider::uuid($libraryId);
            if (null === $library) {
                return self::MISSING; // a mistyped library must not widen the check
            }
        }

        try {
            /** @var array{state: string, library: ?string} $entry */
            $entry = $this->cache->get($this->key($uuid), function (ItemInterface $item, bool &$save) use ($uuid): array {
                if (!$this->takeNewLookup()) {
                    // Not a verdict: the page must not be cached as "not found" for long.
                    $save = false;

                    return ['state' => self::UNAVAILABLE, 'library' => null];
                }

                try {
                    $video = $this->client->getVideo($uuid);
                } catch (VideoOptimizerException $e) {
                    if (404 === $e->getStatusCode()) {
                        $item->expiresAfter(self::TTL_MISSING);

                        return ['state' => self::MISSING, 'library' => null];
                    }
                    // Outage, rejected token, rate limit …: not a verdict, so nothing is remembered.
                    $save = false;

                    return ['state' => self::UNAVAILABLE, 'library' => null];
                }

                $ready = 'ready' === ($video['status'] ?? null);
                $item->expiresAfter($ready ? self::TTL_OK : self::TTL_PENDING);
                $videoLibrary = \is_string($video['library_id'] ?? null) ? strtolower($video['library_id']) : null;

                return ['state' => $ready ? self::OK : self::PENDING, 'library' => $videoLibrary];
            });
        } catch (\Throwable) {
            $entry = ['state' => self::UNAVAILABLE, 'library' => null];
        }

        if (self::PENDING === $entry['state']) {
            // The page is tagged with the video, so its video.ready webhook invalidates it; until then it is short-lived.
            $this->referenceStore?->add($uuid, 'video_optimizer');
            $this->renderState?->markDegraded();

            return self::UNAVAILABLE;
        }
        if (self::UNAVAILABLE === $entry['state']) {
            $this->renderState?->markDegraded();

            return self::UNAVAILABLE;
        }
        if (self::OK === $entry['state'] && null !== $library && $entry['library'] !== $library) {
            return self::MISSING;
        }

        return $entry['state'];
    }

    /**
     * Counts one uncached lookup in the current minute; false once the budget is used up.
     */
    private function takeNewLookup(): bool
    {
        $key = 'vo_own_rate_' . intdiv(time(), 60);
        try {
            /** @var int $count */
            $count = (int) $this->cache->get($key, static function (ItemInterface $item): int {
                $item->expiresAfter(120);

                return 0;
            });
            if ($count >= self::MAX_NEW_PER_MINUTE) {
                return false;
            }
            $this->cache->delete($key);
            $this->cache->get($key, static function (ItemInterface $item) use ($count): int {
                $item->expiresAfter(120);

                return $count + 1;
            });
        } catch (\Throwable) {
            // Without a working counter the cache is broken anyway; do not block the page on it.
        }

        return true;
    }
}
