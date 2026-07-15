<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Controller\Admin;

use Scale\VideoOptimizerBundle\Api\VideoOptimizerClient;
use Scale\VideoOptimizerBundle\Api\VideoOptimizerException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Proxies single-video reads and presigned uploads to VideoOptimizer. The browser PUTs the file
 * parts straight to the presigned URLs returned by "initiate"; only initiate/complete carry the token.
 */
class VideoController
{
    public function __construct(private VideoOptimizerClient $client)
    {
    }

    public function get(string $uuid): JsonResponse
    {
        return $this->guard(fn () => new JsonResponse($this->client->getVideo($uuid)));
    }

    public function initiateUpload(Request $request): JsonResponse
    {
        $payload = $this->decodeJson($request);
        if ('' === (string) ($payload['libraryId'] ?? '')) {
            return new JsonResponse(['message' => 'Missing libraryId.'], 400);
        }

        return $this->guard(fn () => new JsonResponse($this->client->initiateUpload($payload)));
    }

    public function completeUpload(Request $request): JsonResponse
    {
        $payload = $this->decodeJson($request);
        if ('' === (string) ($payload['uuid'] ?? '')) {
            return new JsonResponse(['message' => 'Missing uuid.'], 400);
        }

        return $this->guard(fn () => new JsonResponse($this->client->completeUpload($payload), 201));
    }

    /**
     * @return array<string, mixed>
     */
    private function decodeJson(Request $request): array
    {
        $decoded = json_decode($request->getContent(), true);

        return \is_array($decoded) ? $decoded : [];
    }

    private function guard(callable $callback): JsonResponse
    {
        try {
            return $callback();
        } catch (VideoOptimizerException $e) {
            return new JsonResponse(['message' => $e->getMessage()], $e->getStatusCode() ?: 502);
        }
    }
}
