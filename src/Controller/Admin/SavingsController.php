<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Controller\Admin;

use Scale\VideoOptimizerBundle\Api\VideoOptimizerClient;
use Scale\VideoOptimizerBundle\Api\VideoOptimizerException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Proxies the organization's bandwidth and storage savings (`GET /savings`).
 */
class SavingsController
{
    public function __construct(private VideoOptimizerClient $client)
    {
    }

    public function get(Request $request): JsonResponse
    {
        $param = static function (string $name) use ($request): ?string {
            $value = $request->query->get($name);

            return \is_string($value) && '' !== $value ? $value : null;
        };

        try {
            return new JsonResponse($this->client->getSavings($param('from'), $param('to'), $param('library_id'), $param('video_uuid')));
        } catch (VideoOptimizerException $e) {
            return ApiErrorResponse::create($e);
        }
    }
}
