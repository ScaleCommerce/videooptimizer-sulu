<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Controller\Admin;

use Scale\VideoOptimizerBundle\Api\VideoOptimizerClient;
use Scale\VideoOptimizerBundle\Api\VideoOptimizerException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Proxies library operations to VideoOptimizer using the server-side token.
 */
class LibraryController
{
    private const ENCODING_QUALITIES = ['performance', 'quality'];

    public function __construct(private VideoOptimizerClient $client)
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

        return $this->guard(fn () => new JsonResponse($this->client->updateLibrary($id, $payload)));
    }

    public function delete(string $id): JsonResponse
    {
        return $this->guard(function () use ($id) {
            $this->client->deleteLibrary($id);

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

        return $this->guard(fn () => new JsonResponse($this->client->reprocessLibrary($id, $force)));
    }

    public function encodings(): JsonResponse
    {
        return $this->guard(fn () => new JsonResponse($this->client->listEncodings()));
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
            $body = ['message' => $e->getMessage()];
            if (null !== $e->getApiCode()) {
                $body['code'] = $e->getApiCode();
            }

            return new JsonResponse($body, $e->getStatusCode() ?: 502);
        }
    }
}
