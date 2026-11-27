<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Controller\Admin;

use Scale\VideoOptimizerBundle\Api\VideoOptimizerClient;
use Scale\VideoOptimizerBundle\Api\VideoOptimizerException;
use Scale\VideoOptimizerBundle\Service\VideoOptimizerEmbedResolver;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Proxies library operations to VideoOptimizer using the server-side token.
 */
class LibraryController
{
    private const ENCODING_QUALITIES = ['performance', 'quality'];

    public function __construct(private VideoOptimizerClient $client, private ?VideoOptimizerEmbedResolver $embedResolver = null)
    {
    }

    public function cget(): JsonResponse
    {
        return $this->guard(fn () => new JsonResponse(['_embedded' => ['libraries' => $this->client->listLibraries()]]));
    }

    public function post(Request $request): JsonResponse
    {
        $payload = $this->payload($request);
        if (null !== $invalid = $this->validateEncodingQuality($payload)) {
            return $invalid;
        }

        return $this->guard(fn () => new JsonResponse($this->client->createLibrary($payload), 201));
    }

    public function patch(Request $request, string $id): JsonResponse
    {
        $payload = $this->payload($request);
        if (null !== $invalid = $this->validateEncodingQuality($payload)) {
            return $invalid;
        }

        return $this->guard(function () use ($id, $payload) {
            $result = $this->client->updateLibrary($id, $payload);
            // A changed ladder changes the renditions (and possibly the sources) of every video.
            if (\array_key_exists('codec', $payload) || \array_key_exists('resolutions', $payload)) {
                $this->forgetAll($this->videoUuids($id));
            }

            return new JsonResponse($result);
        });
    }

    public function delete(string $id): JsonResponse
    {
        return $this->guard(function () use ($id) {
            $uuids = $this->videoUuids($id);
            $this->client->deleteLibrary($id);
            $this->forgetAll($uuids);

            return new JsonResponse(null, 204);
        });
    }

    public function videos(string $id): JsonResponse
    {
        return $this->guard(fn () => new JsonResponse(['_embedded' => ['videos' => $this->client->listVideos($id)]]));
    }

    public function reprocess(Request $request, string $id): JsonResponse
    {
        // Optional {"force": true}: re-encode finished renditions too (needed after changing encoding_quality).
        $force = true === ($this->payload($request)['force'] ?? false);

        return $this->guard(function () use ($id, $force) {
            $result = $this->client->reprocessLibrary($id, $force);
            $this->forgetAll($this->videoUuids($id));

            return new JsonResponse($result);
        });
    }

    public function encodings(): JsonResponse
    {
        return $this->guard(fn () => new JsonResponse($this->client->listEncodings()));
    }

    /**
     * UUIDs of a library's videos, so their cached storefront embed data can be dropped. Best effort:
     * when the list cannot be fetched the entries simply expire on their own.
     *
     * @return list<string>
     */
    private function videoUuids(string $id): array
    {
        try {
            $uuids = [];
            foreach ($this->client->listVideos($id) as $video) {
                $uuid = $video['uuid'] ?? $video['id'] ?? null;
                if (\is_string($uuid) && '' !== $uuid) {
                    $uuids[] = $uuid;
                }
            }

            return $uuids;
        } catch (VideoOptimizerException) {
            return [];
        }
    }

    /**
     * @param list<string> $uuids
     */
    private function forgetAll(array $uuids): void
    {
        foreach ($uuids as $uuid) {
            $this->embedResolver?->forget($uuid);
        }
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function validateEncodingQuality(array $payload): ?JsonResponse
    {
        if (\array_key_exists('encoding_quality', $payload) && !\in_array($payload['encoding_quality'], self::ENCODING_QUALITIES, true)) {
            return new JsonResponse(['message' => 'encoding_quality must be "performance" or "quality".'], 400);
        }

        return null;
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(Request $request): array
    {
        $data = json_decode($request->getContent(), true);
        if (!\is_array($data)) {
            return [];
        }

        /** @var array<string, mixed> $data */
        return $data;
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
