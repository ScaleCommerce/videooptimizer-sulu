<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Service;

use Scale\VideoOptimizerBundle\Api\VideoOptimizerClient;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;

/**
 * One page of finished videos for the video list block, cached briefly so a busy page does not call the
 * list endpoint on every render. Input is validated here, so a hand-edited query string cannot reach the API.
 */
class VideoListProvider
{
    public const MAX_PAGE_SIZE = 24;
    public const DEFAULT_PAGE_SIZE = 12;

    public const TTL = 120;

    public function __construct(
        private VideoOptimizerClient $client,
        private CacheInterface $cache,
        private ?EmbedRenderState $renderState = null,
    ) {
    }

    /**
     * @return array{items: list<array{uuid: string, title: string, poster: ?string, duration: ?int}>, next: ?string, error: bool}
     */
    public function page(?string $libraryId, ?string $tags, ?string $cursor, int $limit = self::DEFAULT_PAGE_SIZE): array
    {
        if (null !== $libraryId && '' !== trim($libraryId) && null === self::uuid($libraryId)) {
            // A mistyped library must not fall back to listing every library of the organization.
            return ['items' => [], 'next' => null, 'error' => false];
        }
        $libraryId = self::uuid($libraryId);
        // The API's cursor is opaque but base64url-shaped; anything else is dropped (first page).
        $cursor = null !== $cursor && 1 === preg_match('/^[A-Za-z0-9_=-]{1,200}$/D', $cursor) ? $cursor : null;
        $tags = null !== $tags && '' !== trim($tags) ? mb_substr(trim($tags), 0, 200) : null;
        $limit = max(1, min($limit, self::MAX_PAGE_SIZE));
        // Cached for TTL seconds: the reverse proxy must not keep the page longer than the list it shows.
        $this->renderState?->capLifetime(self::TTL);

        try {
            /** @var array{items: list<array{uuid: string, title: string, poster: ?string, duration: ?int}>, next: ?string} $page */
            $page = $this->cache->get(
                'vo_list_v1_' . sha1(json_encode([$libraryId, $tags, $cursor, $limit], \JSON_THROW_ON_ERROR)),
                function (ItemInterface $item) use ($libraryId, $tags, $cursor, $limit): array {
                    $item->expiresAfter(self::TTL);
                    $response = $this->client->listVideosPage($libraryId, $cursor, $limit, $tags);

                    return ['items' => self::items($response['videos']), 'next' => $response['has_more'] ? $response['next_cursor'] : null];
                },
            );
        } catch (\Throwable) {
            // Nothing is cached for a failure; the page is rendered without the list and must not be kept long.
            $this->renderState?->markDegraded();

            return ['items' => [], 'next' => null, 'error' => true];
        }

        return $page + ['error' => false];
    }

    /**
     * @param array<int, array<string, mixed>> $videos
     *
     * @return list<array{uuid: string, title: string, poster: ?string, duration: ?int}>
     */
    private static function items(array $videos): array
    {
        $items = [];
        foreach ($videos as $video) {
            $uuid = self::uuid(\is_string($video['uuid'] ?? null) ? $video['uuid'] : null);
            if (null === $uuid || 'ready' !== ($video['status'] ?? null)) {
                continue;
            }
            $poster = $video['poster_url'] ?? $video['thumbnail_url'] ?? null;
            $items[] = [
                'uuid' => $uuid,
                'title' => \is_string($video['title'] ?? null) ? $video['title'] : '',
                'poster' => \is_string($poster) && 1 === preg_match('#^https://#i', $poster) ? $poster : null,
                'duration' => \is_numeric($video['duration'] ?? null) && (int) $video['duration'] > 0 ? (int) $video['duration'] : null,
            ];
        }

        return $items;
    }

    public static function uuid(?string $value): ?string
    {
        if (null === $value) {
            return null;
        }
        $value = strtolower(trim($value));

        return 1 === preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/D', $value) ? $value : null;
    }
}
