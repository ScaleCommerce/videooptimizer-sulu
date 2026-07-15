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

        return $this->guard(fn () => new JsonResponse($this->client->createLibrary($payload), 201));
    }

    public function patch(Request $request, string $id): JsonResponse
    {
        $payload = $this->payload($request);

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

    public function reprocess(string $id): JsonResponse
    {
        return $this->guard(fn () => new JsonResponse($this->client->reprocessLibrary($id)));
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(Request $request): array
    {
        $data = json_decode($request->getContent(), true);

        return \is_array($data) ? $data : [];
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
