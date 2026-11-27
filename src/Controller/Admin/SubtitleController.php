<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Controller\Admin;

use Scale\VideoOptimizerBundle\Api\VideoOptimizerClient;
use Scale\VideoOptimizerBundle\Api\VideoOptimizerException;
use Scale\VideoOptimizerBundle\Service\VideoOptimizerEmbedResolver;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Proxies the subtitles of a video and the organization's subtitle languages. The browser sends an
 * uploaded file as JSON (`contentBase64`), the bundle turns it into the multipart request the API expects.
 */
class SubtitleController
{
    /** The API refuses subtitle files above 2 MB. */
    private const MAX_FILE_BYTES = 2 * 1024 * 1024;

    public function __construct(private VideoOptimizerClient $client, private ?VideoOptimizerEmbedResolver $embedResolver = null)
    {
    }

    public function list(string $uuid): JsonResponse
    {
        return $this->guard(fn () => new JsonResponse(['_embedded' => ['subtitles' => $this->client->listSubtitles($uuid)]]));
    }

    public function upload(Request $request, string $uuid): JsonResponse
    {
        $payload = $this->decodeJson($request);
        $language = self::str($payload, 'language');
        if ('' === $language) {
            return new JsonResponse(['message' => 'Missing language.'], 400);
        }
        $content = self::str($payload, 'contentBase64');
        $decoded = '' === $content ? false : base64_decode($content, true);
        if (false === $decoded || '' === $decoded) {
            return new JsonResponse(['message' => 'Missing or invalid subtitle file.'], 400);
        }
        if (\strlen($decoded) > self::MAX_FILE_BYTES) {
            return new JsonResponse(['message' => 'The subtitle file is larger than 2 MB.'], 413);
        }
        $kind = self::str($payload, 'kind');
        $isDefault = \array_key_exists('isDefault', $payload) ? true === $payload['isDefault'] : null;

        return $this->guard(function () use ($uuid, $payload, $decoded, $language, $kind, $isDefault) {
            $result = $this->client->uploadSubtitle($uuid, self::str($payload, 'filename'), $decoded, $language, '' === $kind ? null : $kind, $isDefault);
            $this->embedResolver?->forget($uuid);

            return new JsonResponse($result);
        });
    }

    public function download(string $uuid, string $language): Response
    {
        try {
            $vtt = $this->client->downloadSubtitle($uuid, $language);
        } catch (VideoOptimizerException $e) {
            return ApiErrorResponse::create($e);
        }

        return new Response($vtt, 200, [
            'Content-Type' => 'text/vtt; charset=utf-8',
            'Content-Disposition' => 'attachment; filename=' . $uuid . '.' . $language . '.vtt',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    public function delete(string $uuid, string $language): JsonResponse
    {
        return $this->guard(function () use ($uuid, $language) {
            $this->client->deleteSubtitle($uuid, $language);
            $this->embedResolver?->forget($uuid);

            return new JsonResponse(null, 204);
        });
    }

    public function languages(): JsonResponse
    {
        return $this->guard(fn () => new JsonResponse(['_embedded' => ['languages' => $this->client->listSubtitleLanguages()]]));
    }

    public function createLanguage(Request $request): JsonResponse
    {
        $payload = $this->decodeJson($request);
        $code = self::str($payload, 'code');
        if ('' === $code) {
            return new JsonResponse(['message' => 'Missing language code.'], 400);
        }
        $label = self::str($payload, 'label');

        return $this->guard(fn () => new JsonResponse($this->client->createSubtitleLanguage($code, '' === $label ? null : $label), 201));
    }

    public function deleteLanguage(string $code): JsonResponse
    {
        return $this->guard(function () use ($code) {
            $this->client->deleteSubtitleLanguage($code);

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
