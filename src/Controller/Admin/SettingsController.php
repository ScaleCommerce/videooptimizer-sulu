<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Controller\Admin;

use Scale\VideoOptimizerBundle\Api\VideoOptimizerClient;
use Scale\VideoOptimizerBundle\Api\VideoOptimizerException;
use Scale\VideoOptimizerBundle\Service\SettingsManager;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Read/write the organization-wide VideoOptimizer settings. The token is write-only:
 * it is never returned to the browser, only its "configured" state.
 */
class SettingsController
{
    public function __construct(
        private SettingsManager $settingsManager,
        private VideoOptimizerClient $client,
    ) {
    }

    public function get(): JsonResponse
    {
        return new JsonResponse([
            'configured' => $this->settingsManager->isConfigured(),
            'defaultLibraryId' => $this->settingsManager->getDefaultLibraryId(),
            'defaultPlayer' => $this->settingsManager->getDefaultPlayer(),
        ]);
    }

    public function put(Request $request): JsonResponse
    {
        $payload = json_decode($request->getContent(), true);
        if (!\is_array($payload)) {
            return new JsonResponse(['message' => 'Invalid payload.'], 400);
        }

        $defaultPlayer = $payload['defaultPlayer'] ?? null;
        if (!\is_string($defaultPlayer) || !\in_array($defaultPlayer, ['hosted', 'native'], true)) {
            $defaultPlayer = null;
        }

        $this->settingsManager->save(
            \is_string($payload['token'] ?? null) ? $payload['token'] : null,
            \is_string($payload['defaultLibraryId'] ?? null) ? $payload['defaultLibraryId'] : null,
            $defaultPlayer,
        );

        return $this->get();
    }

    /**
     * Verifies the stored token by calling the VideoOptimizer API.
     */
    public function test(): JsonResponse
    {
        try {
            $libraries = $this->client->listLibraries();
        } catch (VideoOptimizerException $e) {
            return new JsonResponse(['ok' => false, 'message' => $e->getMessage()], 200);
        }

        return new JsonResponse(['ok' => true, 'libraryCount' => \count($libraries)]);
    }
}
