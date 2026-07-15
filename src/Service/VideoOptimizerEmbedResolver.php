<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Service;

use Scale\VideoOptimizerBundle\Api\VideoOptimizerClient;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;

/**
 * Resolves the playable sources for a VideoOptimizer background video.
 * Only HLS is used for background playback; the poster is the universal fallback.
 * Results are cached because CDN source URLs are stable.
 */
class VideoOptimizerEmbedResolver
{
    public function __construct(
        private VideoOptimizerClient $client,
        private CacheInterface $cache,
    ) {
    }

    /**
     * @return array{poster: ?string, hlsUrl: ?string, width: ?int, height: ?int, duration: ?int, srcset: ?string}
     */
    public function getSources(string $uuid): array
    {
        try {
            return $this->cache->get('vo_embed_' . $uuid, function (ItemInterface $item) use ($uuid): array {
                $item->expiresAfter(86400);

                return self::extractSources($this->client->getEmbed($uuid));
            });
        } catch (\Throwable) {
            // Do not cache failures: a transient API/network error must not hide the video for 24h.
            return ['poster' => null, 'hlsUrl' => null, 'width' => null, 'height' => null, 'duration' => null, 'srcset' => null];
        }
    }

    /**
     * Returns a ready-to-use responsive poster srcset string, or null when the API provides none.
     */
    public function getPosterSrcset(string $uuid): ?string
    {
        return $this->getSources($uuid)['srcset'] ?? null;
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
     * @return array{poster: ?string, hlsUrl: ?string, width: ?int, height: ?int, duration: ?int, srcset: ?string}
     */
    public static function extractSources(array $data): array
    {
        $poster = \is_string($data['poster'] ?? null) ? $data['poster'] : null;

        $hlsUrl = null;
        foreach ((array) ($data['sources'] ?? []) as $source) {
            if (!\is_array($source)) {
                continue;
            }
            if ('application/vnd.apple.mpegurl' === ($source['type'] ?? '') && \is_string($source['src'] ?? null) && '' !== $source['src']) {
                $hlsUrl = $source['src'];
                break;
            }
        }

        [$width, $height] = self::parseResolution($data['resolution'] ?? null);

        $duration = \is_numeric($data['duration'] ?? null) ? (int) $data['duration'] : null;

        return [
            'poster' => $poster,
            'hlsUrl' => $hlsUrl,
            'width' => $width,
            'height' => $height,
            'duration' => $duration,
            'srcset' => self::parsePosterSrcset($data['posterSrcset'] ?? null),
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
    public static function isoDuration(?int $seconds): ?string
    {
        if (null === $seconds || $seconds <= 0) {
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
