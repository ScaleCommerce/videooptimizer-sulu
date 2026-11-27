<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Service;

use Scale\VideoOptimizerBundle\Api\VideoOptimizerClient;
use Scale\VideoOptimizerBundle\Api\VideoOptimizerException;
use Sulu\Bundle\HttpCacheBundle\ReferenceStore\ReferenceStoreInterface;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;

/**
 * Resolves the playable sources for a VideoOptimizer background video.
 * Only HLS is used for background playback; the poster is the universal fallback.
 * Results are cached because CDN source URLs are stable.
 */
class VideoOptimizerEmbedResolver
{
    public const HLS_MIME = 'application/vnd.apple.mpegurl';

    /** Cache lifetime for playable videos (poster, theme and source changes show up within an hour). */
    private const TTL_PLAYABLE = 3600;

    /** Cache lifetime for failures and videos without sources (not ready yet), so they recover quickly. */
    private const TTL_UNAVAILABLE = 60;

    /** Cache key of the service-wide flag set while the API is unreachable or rate limiting (fail fast). */
    private const API_DOWN_KEY = 'vo_embed_api_down';

    public function __construct(
        private VideoOptimizerClient $client,
        private CacheInterface $cache,
        private ?EmbedRenderState $renderState = null,
        private ?ReferenceStoreInterface $referenceStore = null,
    ) {
    }

    /**
     * @return array{title: ?string, poster: ?string, hlsUrl: ?string, width: ?int, height: ?int, duration: ?float, srcset: ?string, theme: ?array<int|string, mixed>, tracks: array<int, array{src: string, srclang: string, label: string, kind: string, default: bool}>, sources: array<int, array{src:string,type:string,label:string}>}
     */
    public function getSources(string $uuid): array
    {
        // Tags the rendered page with the video (tag = its UUID), so a webhook can invalidate exactly the
        // cached pages that show it.
        $this->referenceStore?->add($uuid, 'video_optimizer');

        $result = $this->lookup($uuid);
        if ([] === $result['sources']) {
            // The page is rendered without this video: do not let the HTTP cache keep it for long.
            $this->renderState?->markDegraded();
        }

        return $result;
    }

    /**
     * @return array{title: ?string, poster: ?string, hlsUrl: ?string, width: ?int, height: ?int, duration: ?float, srcset: ?string, theme: ?array<int|string, mixed>, tracks: array<int, array{src: string, srclang: string, label: string, kind: string, default: bool}>, sources: array<int, array{src:string,type:string,label:string}>}
     */
    private function lookup(string $uuid): array
    {
        try {
            return $this->cache->get(self::cacheKey($uuid), function (ItemInterface $item, bool &$save) use ($uuid): array {
                // While the API is flagged as down, do not ask it again for videos that are not cached:
                // neither cache the skipped video nor prolong the flag.
                if ($this->apiDown()) {
                    $save = false;

                    return self::unavailable();
                }

                try {
                    $sources = self::extractSources($this->client->getEmbed($uuid));
                } catch (\Throwable $e) {
                    if ($e instanceof VideoOptimizerException && \in_array($e->getStatusCode(), [429, 502, 503, 504], true)) {
                        $this->markApiDown();
                    }
                    // Remember a failure only briefly: it stops a broken API from being hit on every
                    // render, yet a transient error does not hide the video for long.
                    $item->expiresAfter(self::TTL_UNAVAILABLE);

                    return self::unavailable();
                }

                $item->expiresAfter([] === $sources['sources'] ? self::TTL_UNAVAILABLE : self::TTL_PLAYABLE);

                return $sources;
            });
        } catch (\Throwable) {
            // The cache itself failed: render without it.
            return self::unavailable();
        }
    }

    private function apiDown(): bool
    {
        try {
            /** @var mixed $flag */
            $flag = $this->cache->get(self::API_DOWN_KEY, static function (ItemInterface $item, bool &$save): mixed {
                $save = false;

                return false;
            });

            return true === $flag;
        } catch (\Throwable) {
            return false;
        }
    }

    private function markApiDown(): void
    {
        try {
            $this->cache->delete(self::API_DOWN_KEY);
            $this->cache->get(self::API_DOWN_KEY, static function (ItemInterface $item): bool {
                $item->expiresAfter(self::TTL_UNAVAILABLE);

                return true;
            });
        } catch (\Throwable) {
            // Without the flag every uncached video simply asks the API itself.
        }
    }

    /**
     * Drops the cached embed data of a video, e.g. after it was changed or deleted in the admin.
     */
    public function forget(string $uuid): void
    {
        try {
            $this->cache->delete(self::cacheKey($uuid));
        } catch (\Throwable) {
            // Best effort: the entry expires on its own.
        }
    }

    private static function cacheKey(string $uuid): string
    {
        // v4: entries cached before 2.2.0 carry no title; v3: before 2.1.0 no subtitle tracks; v2 predates 1.8.1 (24 h lifetime).
        return 'vo_embed_v4_' . $uuid;
    }

    /**
     * @return array{title: ?string, poster: ?string, hlsUrl: ?string, width: ?int, height: ?int, duration: ?float, srcset: ?string, theme: ?array<int|string, mixed>, tracks: array<int, array{src: string, srclang: string, label: string, kind: string, default: bool}>, sources: array<int, array{src:string,type:string,label:string}>}
     */
    private static function unavailable(): array
    {
        return ['title' => null, 'poster' => null, 'hlsUrl' => null, 'width' => null, 'height' => null, 'duration' => null, 'srcset' => null, 'theme' => null, 'tracks' => [], 'sources' => []];
    }

    /**
     * Returns a ready-to-use responsive poster srcset string, or null when the API provides none.
     */
    public function getPosterSrcset(string $uuid): ?string
    {
        return $this->getSources($uuid)['srcset'] ?? null;
    }

    /**
     * The poster srcset of a video whose embed data is already cached, else null. Never calls the API, never
     * marks the page degraded and does not tag it.
     */
    public function peekPosterSrcset(string $uuid): ?string
    {
        try {
            /** @var mixed $entry */
            $entry = $this->cache->get(self::cacheKey($uuid), static function (ItemInterface $item, bool &$save): mixed {
                $save = false;

                return null;
            });

            return \is_array($entry) && \is_string($entry['srcset'] ?? null) ? $entry['srcset'] : null;
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * Returns the pixel dimensions and orientation of a video, reusing the cached embed lookup.
     *
     * @return array{width: ?int, height: ?int, orientation: ?string}
     */
    public function getDimensions(string $uuid): array
    {
        $sources = $this->getSources($uuid);
        $width = $sources['width'] ?? null;
        $height = $sources['height'] ?? null;

        return [
            'width' => $width,
            'height' => $height,
            'orientation' => self::orientationFor($width, $height),
        ];
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array{title: ?string, poster: ?string, hlsUrl: ?string, width: ?int, height: ?int, duration: ?float, srcset: ?string, theme: ?array<int|string, mixed>, tracks: array<int, array{src: string, srclang: string, label: string, kind: string, default: bool}>, sources: array<int, array{src:string,type:string,label:string}>}
     */
    public static function extractSources(array $data): array
    {
        $poster = \is_string($data['poster'] ?? null) ? $data['poster'] : null;

        $hlsUrl = null;
        $sources = [];
        foreach ((array) ($data['sources'] ?? []) as $source) {
            if (!\is_array($source) || !\is_string($source['src'] ?? null) || '' === $source['src']) {
                continue;
            }

            if (null === $hlsUrl && self::HLS_MIME === ($source['type'] ?? '')) {
                $hlsUrl = $source['src'];
            }

            $sources[] = [
                'src' => $source['src'],
                'type' => \is_string($source['type'] ?? null) ? $source['type'] : '',
                'label' => \is_string($source['label'] ?? null) ? $source['label'] : '',
            ];
        }

        $themeData = $data['theme'] ?? null;
        $theme = \is_array($themeData) ? $themeData : null;

        [$width, $height] = self::parseResolution($data['resolution'] ?? null);

        $duration = \is_numeric($data['duration'] ?? null) ? (float) $data['duration'] : null;

        return [
            'title' => \is_string($data['title'] ?? null) && '' !== $data['title'] ? $data['title'] : null,
            'poster' => $poster,
            'hlsUrl' => $hlsUrl,
            'width' => $width,
            'height' => $height,
            'duration' => $duration,
            'srcset' => self::parsePosterSrcset($data['posterSrcset'] ?? null),
            'theme' => $theme,
            'tracks' => self::extractTracks($data['tracks'] ?? null),
            'sources' => $sources,
        ];
    }

    /**
     * Keeps the usable subtitle tracks of an embed response: an https WebVTT `src` and a language code.
     *
     * @return array<int, array{src: string, srclang: string, label: string, kind: string, default: bool}>
     */
    public static function extractTracks(mixed $tracks): array
    {
        if (!\is_array($tracks)) {
            return [];
        }

        $result = [];
        foreach ($tracks as $track) {
            if (!\is_array($track)) {
                continue;
            }
            $src = $track['src'] ?? null;
            $lang = $track['srclang'] ?? null;
            if (!\is_string($src) || 1 !== preg_match('#^https://#i', $src) || !\is_string($lang) || 1 !== preg_match('/^[A-Za-z]{2,3}(-[A-Za-z0-9]{1,8})*$/D', $lang)) {
                continue;
            }
            $label = \is_string($track['label'] ?? null) && '' !== $track['label'] ? $track['label'] : $lang;
            $result[] = [
                'src' => $src,
                'srclang' => $lang,
                'label' => $label,
                'kind' => 'captions' === ($track['kind'] ?? null) ? 'captions' : 'subtitles',
                'default' => true === ($track['default'] ?? false),
            ];
        }

        return $result;
    }

    /**
     * Returns the essentials a client-side player needs to boot: poster, playable sources, theme
     * overrides and native dimensions. Thin projection over the cached getSources() lookup.
     *
     * @return array{poster: ?string, sources: array<int, array{src:string,type:string,label:string}>, theme: ?array<int|string, mixed>, tracks: array<int, array{src: string, srclang: string, label: string, kind: string, default: bool}>, width: ?int, height: ?int}
     */
    public function getPlayable(string $uuid): array
    {
        $sources = $this->getSources($uuid);

        return [
            'poster' => $sources['poster'],
            'sources' => $sources['sources'],
            'theme' => $sources['theme'],
            'tracks' => $sources['tracks'],
            'width' => $sources['width'],
            'height' => $sources['height'],
        ];
    }

    /**
     * Builds an <img srcset> string from the API's posterSrcset. The API returns entries shaped
     * `{width, height, url}`; ready-made descriptor strings ("url 320w") and a legacy `src` key are
     * also accepted. Entries without a positive width are skipped so we never emit an invalid
     * srcset. Returns null when nothing usable is present.
     */
    public static function parsePosterSrcset(mixed $posterSrcset): ?string
    {
        if (!\is_array($posterSrcset) || [] === $posterSrcset) {
            return null;
        }

        $entries = [];
        foreach ($posterSrcset as $entry) {
            if (\is_string($entry) && 1 === \preg_match('/\s\d+[wx]\s*$/', $entry)) {
                $entries[] = trim($entry);
                continue;
            }

            if (!\is_array($entry)) {
                continue;
            }

            $url = $entry['url'] ?? $entry['src'] ?? null;
            $width = $entry['width'] ?? null;
            if (\is_string($url) && '' !== $url && \is_numeric($width) && (int) $width > 0) {
                $entries[] = $url . ' ' . (int) $width . 'w';
            }
        }

        return [] === $entries ? null : implode(', ', $entries);
    }

    /**
     * Formats a duration in seconds as an ISO-8601 duration (e.g. 90 -> "PT1M30S") for schema.org.
     */
    public static function isoDuration(int|float|null $seconds): ?string
    {
        $seconds = null === $seconds ? 0 : (int) round($seconds);
        if ($seconds <= 0) {
            return null;
        }

        $hours = intdiv($seconds, 3600);
        $minutes = intdiv($seconds % 3600, 60);
        $secs = $seconds % 60;

        return 'PT'
            . ($hours > 0 ? $hours . 'H' : '')
            . ($minutes > 0 ? $minutes . 'M' : '')
            . ($secs > 0 || (0 === $hours && 0 === $minutes) ? $secs . 'S' : '');
    }

    /**
     * Parses a "WIDTHxHEIGHT" resolution string (e.g. "1260x710") into integer dimensions.
     *
     * @return array{0: ?int, 1: ?int}
     */
    public static function parseResolution(mixed $resolution): array
    {
        if (\is_string($resolution) && 1 === \preg_match('/^\s*(\d+)\s*x\s*(\d+)\s*$/i', $resolution, $matches)) {
            return [(int) $matches[1], (int) $matches[2]];
        }

        return [null, null];
    }

    public static function orientationFor(?int $width, ?int $height): ?string
    {
        if (null === $width || null === $height || $width <= 0 || $height <= 0) {
            return null;
        }

        if ($width > $height) {
            return 'landscape';
        }

        return $width < $height ? 'portrait' : 'square';
    }
}
