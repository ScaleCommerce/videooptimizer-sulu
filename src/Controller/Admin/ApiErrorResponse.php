<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Controller\Admin;

use Scale\VideoOptimizerBundle\Api\VideoOptimizerException;
use Symfony\Component\HttpFoundation\JsonResponse;

/**
 * Turns a failed VideoOptimizer API call into the admin proxy's error response.
 *
 * Upstream 401/403 are NOT passed through: Sulu's admin treats every 401 as an expired session and
 * logs the editor out. They become a 502 with a code the admin UI translates
 * (`token_rejected`, `token_forbidden`). A 403 also covers plan limits, trial restrictions and
 * suspended organizations, so the API's own message is kept (`upstream: true`) when it has one.
 */
final class ApiErrorResponse
{
    public const TOKEN_REJECTED = 'token_rejected';
    public const TOKEN_FORBIDDEN = 'token_forbidden';

    private const REJECTED_MESSAGE = 'The VideoOptimizer API rejected the API token. Check the token under VideoOptimizer > Settings.';
    private const FORBIDDEN_MESSAGE = 'The VideoOptimizer API token is not permitted to perform this action. Check the token permissions in VideoOptimizer.';

    /**
     * @return array{status: int, body: array<string, mixed>}
     */
    public static function describe(VideoOptimizerException $e): array
    {
        $status = $e->getStatusCode();

        if (401 === $status) {
            return ['status' => 502, 'body' => ['message' => self::REJECTED_MESSAGE, 'code' => self::TOKEN_REJECTED]];
        }

        if (403 === $status) {
            $upstream = self::hasUpstreamMessage($e);

            return [
                'status' => 502,
                'body' => ['message' => $upstream ? $e->getMessage() : self::FORBIDDEN_MESSAGE, 'code' => self::TOKEN_FORBIDDEN] + ($upstream ? ['upstream' => true] : []),
            ];
        }

        $body = ['message' => $e->getMessage()];
        if (null !== $e->getApiCode()) {
            $body['code'] = $e->getApiCode();
        }

        return ['status' => $status ?: 502, 'body' => $body];
    }

    public static function create(VideoOptimizerException $e): JsonResponse
    {
        $described = self::describe($e);

        return new JsonResponse($described['body'], $described['status']);
    }

    /**
     * The client falls back to a generic text when the API sent no message.
     */
    private static function hasUpstreamMessage(VideoOptimizerException $e): bool
    {
        return 'VideoOptimizer request failed.' !== $e->getMessage() && '' !== $e->getMessage();
    }
}
