<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Controller\Admin;

use Scale\VideoOptimizerBundle\Api\VideoOptimizerClient;
use Scale\VideoOptimizerBundle\Api\VideoOptimizerException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Proxies single-video reads/writes to VideoOptimizer: presigned uploads, patch/delete, thumbnail
 * selection, custom-poster CRUD, and remote-URL ingest. The browser PUTs file parts straight to the
 * presigned URLs returned by "initiate"; all other calls carry the server-side token.
 */
class VideoController
{
    public function __construct(private VideoOptimizerClient $client)
    {
    }

    public function list(Request $request): JsonResponse
    {
        $libraryId = $request->query->get('library_id');
        $libraryId = \is_string($libraryId) && '' !== $libraryId ? $libraryId : null;

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

    public function patch(Request $request, string $uuid): JsonResponse
    {
        return $this->guard(fn () => new JsonResponse($this->client->updateVideo($uuid, $this->decodeJson($request))));
    }

    public function delete(string $uuid): JsonResponse
    {
        return $this->guard(function () use ($uuid) {
            $this->client->deleteVideo($uuid);

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

        return $this->guard(fn () => new JsonResponse($this->client->selectThumbnail($uuid, $index)));
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

        return $this->guard(fn () => new JsonResponse($this->client->completePosterUpload($uuid, $key)));
    }

    public function posterSelect(Request $request, string $uuid): JsonResponse
    {
        return $this->guard(fn () => new JsonResponse($this->client->selectPoster($uuid, $this->decodeJson($request))));
    }

    public function posterDelete(string $uuid): JsonResponse
    {
        return $this->guard(function () use ($uuid) {
            $this->client->deletePoster($uuid);

            return new JsonResponse(null, 204);
        });
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
            return new JsonResponse(['message' => $e->getMessage()], $e->getStatusCode() ?: 502);
        }
    }
}
