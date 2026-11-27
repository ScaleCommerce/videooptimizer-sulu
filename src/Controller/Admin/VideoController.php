<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Controller\Admin;

use Scale\VideoOptimizerBundle\Api\VideoOptimizerClient;
use Scale\VideoOptimizerBundle\Api\VideoOptimizerException;
use Scale\VideoOptimizerBundle\Service\VideoOptimizerEmbedResolver;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Proxies single-video reads/writes to VideoOptimizer: presigned uploads, patch/delete, thumbnail
 * selection, custom-poster CRUD, and remote-URL ingest. The browser PUTs file parts straight to the
 * presigned URLs returned by "initiate"; all other calls carry the server-side token.
 */
class VideoController
{
    public function __construct(private VideoOptimizerClient $client, private ?VideoOptimizerEmbedResolver $embedResolver = null)
    {
    }

    public function list(Request $request): JsonResponse
    {
        $libraryId = $request->query->get('library_id');
        $libraryId = \is_string($libraryId) && '' !== $libraryId ? $libraryId : null;

        // Paged mode ("load more"): the admin sends limit and/or cursor and gets one page plus the next
        // cursor. Without them every video is returned, as before.
        if ($request->query->has('limit') || $request->query->has('cursor')) {
            $cursor = $request->query->get('cursor');
            $tags = $request->query->get('tags');

            return $this->guard(function () use ($libraryId, $cursor, $tags, $request) {
                $page = $this->client->listVideosPage(
                    $libraryId,
                    \is_string($cursor) ? $cursor : null,
                    $request->query->getInt('limit', 60),
                    \is_string($tags) ? $tags : null,
                );

                return new JsonResponse(['_embedded' => ['videos' => $page['videos']], 'next_cursor' => $page['next_cursor'], 'has_more' => $page['has_more']]);
            });
        }

        return $this->guard(fn () => new JsonResponse(['_embedded' => ['videos' => $this->client->listAllVideos($libraryId)]]));
    }

    public function get(string $uuid): JsonResponse
    {
        return $this->guard(fn () => new JsonResponse($this->client->getVideo($uuid)));
    }

    public function initiateUpload(Request $request): JsonResponse
    {
        $payload = $this->decodeJson($request);
        if ('' === self::str($payload, 'libraryId')) {
            return new JsonResponse(['message' => 'Missing libraryId.'], 400);
        }

        return $this->guard(fn () => new JsonResponse($this->client->initiateUpload($payload)));
    }

    public function completeUpload(Request $request): JsonResponse
    {
        $payload = $this->decodeJson($request);
        if ('' === self::str($payload, 'uuid')) {
            return new JsonResponse(['message' => 'Missing uuid.'], 400);
        }

        return $this->guard(fn () => new JsonResponse($this->client->completeUpload($payload), 201));
    }

    public function ingestUrl(Request $request): JsonResponse
    {
        $payload = $this->decodeJson($request);
        if ('' === self::str($payload, 'library_id') || '' === self::str($payload, 'source_url')) {
            return new JsonResponse(['message' => 'Missing library_id or source_url.'], 400);
        }

        return $this->guard(fn () => new JsonResponse($this->client->ingestVideoUrl($payload)));
    }

    public function tags(): JsonResponse
    {
        return $this->guard(fn () => new JsonResponse(['_embedded' => ['tags' => $this->client->listTags()]]));
    }

    public function patch(Request $request, string $uuid): JsonResponse
    {
        $payload = $this->decodeJson($request);
        $invalid = $this->normalizeTagsAndMetadata($payload);
        if (null !== $invalid) {
            return new JsonResponse(['message' => $invalid], 400);
        }

        return $this->guard(fn () => new JsonResponse($this->forgetAfter($uuid, $this->client->updateVideo($uuid, $payload))));
    }

    public function delete(string $uuid): JsonResponse
    {
        return $this->guard(function () use ($uuid) {
            $this->client->deleteVideo($uuid);
            $this->embedResolver?->forget($uuid);

            return new JsonResponse(null, 204);
        });
    }

    public function thumbnails(string $uuid): JsonResponse
    {
        return $this->guard(fn () => new JsonResponse($this->client->listThumbnails($uuid)));
    }

    public function selectThumbnail(Request $request, string $uuid): JsonResponse
    {
        $index = self::int($this->decodeJson($request), 'thumbnailIndex', -1);
        if ($index < 0) {
            return new JsonResponse(['message' => 'Missing thumbnailIndex.'], 400);
        }

        return $this->guard(fn () => new JsonResponse($this->forgetAfter($uuid, $this->client->selectThumbnail($uuid, $index))));
    }

    public function posterInitiate(Request $request, string $uuid): JsonResponse
    {
        return $this->guard(fn () => new JsonResponse($this->client->initiatePosterUpload($uuid, $this->decodeJson($request))));
    }

    public function posterComplete(Request $request, string $uuid): JsonResponse
    {
        $key = self::str($this->decodeJson($request), 'key');
        if ('' === $key) {
            return new JsonResponse(['message' => 'Missing key.'], 400);
        }

        return $this->guard(fn () => new JsonResponse($this->forgetAfter($uuid, $this->client->completePosterUpload($uuid, $key))));
    }

    public function posterSelect(Request $request, string $uuid): JsonResponse
    {
        return $this->guard(fn () => new JsonResponse($this->forgetAfter($uuid, $this->client->selectPoster($uuid, $this->decodeJson($request)))));
    }

    public function posterDelete(string $uuid): JsonResponse
    {
        return $this->guard(function () use ($uuid) {
            $this->client->deletePoster($uuid);
            $this->embedResolver?->forget($uuid);

            return new JsonResponse(null, 204);
        });
    }

    /**
     * Drops the cached storefront embed data of a video that was just changed, then passes the
     * API result through.
     *
     * @param array<string, mixed> $result
     *
     * @return array<string, mixed>
     */
    private function forgetAfter(string $uuid, array $result): array
    {
        $this->embedResolver?->forget($uuid);

        return $result;
    }

    /**
     * Validates and normalizes `tags` (replaces the set: trimmed, no empties, case-insensitive unique, max. 20
     * of 1-50 characters without commas) and `metadata` (max. 10 keys of `a-z0-9_.-`, string values of 1-64
     * characters, null removes a key) the way the API demands, so editors get a clear 400 instead of a vague one.
     *
     * @param array<string, mixed> $payload
     *
     * @return string|null the error message, null when valid
     */
    private function normalizeTagsAndMetadata(array &$payload): ?string
    {
        if (\array_key_exists('tags', $payload)) {
            if (!\is_array($payload['tags'])) {
                return 'tags must be a list of names.';
            }
            $tags = [];
            $seen = [];
            foreach ($payload['tags'] as $tag) {
                if (!\is_string($tag)) {
                    return 'tags must be a list of names.';
                }
                $tag = trim($tag);
                if ('' === $tag || isset($seen[mb_strtolower($tag)])) {
                    continue;
                }
                if (mb_strlen($tag) > 50 || str_contains($tag, ',')) {
                    return 'A tag has 1-50 characters and no comma.';
                }
                $seen[mb_strtolower($tag)] = true;
                $tags[] = $tag;
            }
            if (\count($tags) > 20) {
                return 'A video can have at most 20 tags.';
            }
            $payload['tags'] = $tags;
        }

        if (\array_key_exists('metadata', $payload) && [] === $payload['metadata']) {
            // `{}` decodes to an empty array: nothing to change (and an empty array would be sent as a list).
            unset($payload['metadata']);
        }
        if (\array_key_exists('metadata', $payload) && null !== $payload['metadata']) {
            if (!\is_array($payload['metadata']) || array_is_list($payload['metadata']) && [] !== $payload['metadata']) {
                return 'metadata must be an object.';
            }
            if (\count(array_filter($payload['metadata'], static fn ($value): bool => null !== $value)) > 10) {
                return 'A video can have at most 10 metadata entries.';
            }
            foreach ($payload['metadata'] as $key => $value) {
                if (1 !== preg_match('/^[a-z0-9][a-z0-9_.-]{0,39}$/', (string) $key)) {
                    return 'A metadata key has 1-40 characters of a-z, 0-9, _, . and -.';
                }
                if (null === $value) {
                    continue;
                }
                if (!\is_string($value) || '' !== $value && (mb_strlen(trim($value)) < 1 || mb_strlen($value) > 64 || 1 === preg_match('/[\x00-\x1F\x7F]/', $value))) {
                    return 'A metadata value has 1-64 characters.';
                }
            }
        }

        return null;
    }

    /**
     * @return array<string, mixed>
     */
    private function decodeJson(Request $request): array
    {
        $decoded = json_decode($request->getContent(), true);
        if (!\is_array($decoded)) {
            return [];
        }

        /** @var array<string, mixed> $decoded */
        return $decoded;
    }

    /**
     * @param array<string, mixed> $data
     */
    private static function str(array $data, string $key): string
    {
        $value = $data[$key] ?? null;

        return \is_scalar($value) ? (string) $value : '';
    }

    /**
     * @param array<string, mixed> $data
     */
    private static function int(array $data, string $key, int $default): int
    {
        $value = $data[$key] ?? null;

        return \is_numeric($value) ? (int) $value : $default;
    }

    /**
     * @param callable(): JsonResponse $callback
     */
    private function guard(callable $callback): JsonResponse
    {
        try {
            return $callback();
        } catch (VideoOptimizerException $e) {
            return ApiErrorResponse::create($e);
        }
    }
}
