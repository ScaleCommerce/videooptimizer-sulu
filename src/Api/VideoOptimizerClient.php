<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Api;

use Scale\VideoOptimizerBundle\Service\SettingsManager;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Contracts\HttpClient\ResponseInterface;

/**
 * Thin server-side client for the VideoOptimizer REST API. The API token is read from the
 * organization settings, so it never reaches the browser. Payloads are wrapped in { "data": ... }.
 *
 * @see https://api.videooptimizer.eu/developers
 */
class VideoOptimizerClient
{
    private const PAGE_LIMIT = 100;
    private const MAX_PAGES = 100;
    private const MAX_RETRY_AFTER = 5;

    public function __construct(
        private HttpClientInterface $httpClient,
        private SettingsManager $settingsManager,
        private string $baseUrl,
    ) {
    }

    public function isConfigured(): bool
    {
        return $this->settingsManager->isConfigured();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listLibraries(): array
    {
        return $this->requestAllPages('/libraries');
    }

    /**
     * @param array<string, mixed> $payload
     *
     * @return array<string, mixed>
     */
    public function createLibrary(array $payload): array
    {
        return $this->requestData('POST', '/libraries', ['json' => $payload]);
    }

    /**
     * @param array<string, mixed> $payload
     *
     * @return array<string, mixed>
     */
    public function updateLibrary(string $id, array $payload): array
    {
        return $this->requestData('PATCH', '/libraries/' . rawurlencode($id), ['json' => $payload]);
    }

    public function deleteLibrary(string $id): void
    {
        $this->request('DELETE', '/libraries/' . rawurlencode($id));
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listVideos(string $libraryId): array
    {
        return $this->requestAllPages('/libraries/' . rawurlencode($libraryId) . '/videos');
    }

    /**
     * @return array<string, mixed>
     */
    public function getVideo(string $uuid): array
    {
        return $this->requestData('GET', '/videos/' . rawurlencode($uuid));
    }

    /**
     * Fetches the public embed payload (theme, sources, poster) for a video.
     *
     * @return array<string, mixed>
     */
    public function getEmbed(string $uuid): array
    {
        // Runs during page rendering: cap the request so a slow/hanging upstream falls back fast
        // to the poster / default frame instead of blocking the response.
        return $this->requestData('GET', '/embed/' . rawurlencode($uuid), ['max_duration' => 3.0]);
    }

    /**
     * Starts a presigned multipart upload: returns the upload id plus per-part PUT URLs the browser
     * uploads directly to. The API token stays server-side; the browser only sees the presigned URLs.
     *
     * @param array<string, mixed> $payload expects libraryId, filename, contentType, fileSize
     *
     * @return array<string, mixed>
     */
    public function initiateUpload(array $payload): array
    {
        return $this->requestData('POST', '/videos/upload/initiate', ['json' => $payload]);
    }

    /**
     * Finalizes a presigned multipart upload once every part has been PUT to its presigned URL.
     *
     * @param array<string, mixed> $payload expects libraryId, uuid, key, uploadId, parts[] and optional title
     *
     * @return array<string, mixed>
     */
    public function completeUpload(array $payload): array
    {
        return $this->requestData('POST', '/videos/upload/complete', ['json' => $payload]);
    }

    /**
     * @param array<string, mixed> $payload expects title and/or option{responsive,autoplay,preload,loop,muted}
     *
     * @return array<string, mixed>
     */
    public function updateVideo(string $uuid, array $payload): array
    {
        return $this->requestData('PATCH', '/videos/' . rawurlencode($uuid), ['json' => $payload]);
    }

    public function deleteVideo(string $uuid): void
    {
        $this->request('DELETE', '/videos/' . rawurlencode($uuid));
    }

    /**
     * @return array<string, mixed> the data object, shaped ['thumbnails' => [{index, url}, ...]]
     */
    public function listThumbnails(string $uuid): array
    {
        return $this->requestData('GET', '/videos/' . rawurlencode($uuid) . '/thumbnails');
    }

    /**
     * @return array<string, mixed>
     */
    public function selectThumbnail(string $uuid, int $index): array
    {
        return $this->requestData('POST', '/videos/' . rawurlencode($uuid) . '/thumbnail', ['json' => ['thumbnailIndex' => $index]]);
    }

    /**
     * @param array<string, mixed> $payload expects contentType (image/jpeg|png|webp) and fileSize
     *
     * @return array<string, mixed> {key, uploadUrl}
     */
    public function initiatePosterUpload(string $uuid, array $payload): array
    {
        return $this->requestData('POST', '/videos/' . rawurlencode($uuid) . '/poster/initiate', ['json' => $payload]);
    }

    /**
     * @return array<string, mixed>
     */
    public function completePosterUpload(string $uuid, string $key): array
    {
        return $this->requestData('POST', '/videos/' . rawurlencode($uuid) . '/poster/complete', ['json' => ['key' => $key]]);
    }

    /**
     * @param array<string, mixed> $payload expects source (custom|thumbnail) and optional thumbnailIndex
     *
     * @return array<string, mixed>
     */
    public function selectPoster(string $uuid, array $payload): array
    {
        return $this->requestData('POST', '/videos/' . rawurlencode($uuid) . '/poster/select', ['json' => $payload]);
    }

    public function deletePoster(string $uuid): void
    {
        $this->request('DELETE', '/videos/' . rawurlencode($uuid) . '/poster');
    }

    /**
     * Fetches every page of a cursor-paginated list endpoint and returns the merged items.
     *
     * @return array<int, array<string, mixed>>
     */
    private function requestAllPages(string $path): array
    {
        $items = [];
        $cursor = null;
        $previousCursor = null;

        for ($page = 0; $page < self::MAX_PAGES; ++$page) {
            $query = ['limit' => self::PAGE_LIMIT];
            if (null !== $cursor) {
                $query['cursor'] = $cursor;
            }

            $response = $this->request('GET', $path, ['query' => $query]);

            $data = $response['data'] ?? null;
            if (\is_array($data)) {
                foreach ($data as $item) {
                    $items[] = $item;
                }
            }

            $pagination = $response['pagination'] ?? null;
            if (!\is_array($pagination) || true !== ($pagination['has_more'] ?? false)) {
                break;
            }

            $cursor = \is_string($pagination['next_cursor'] ?? null) ? $pagination['next_cursor'] : null;
            // Stop if the cursor is empty or stuck, so a misbehaving upstream cannot loop forever.
            if (null === $cursor || '' === $cursor || $cursor === $previousCursor) {
                break;
            }
            $previousCursor = $cursor;
        }

        return $items;
    }

    /**
     * @param array<string, mixed> $options
     *
     * @return array<int|string, mixed>
     */
    private function requestData(string $method, string $path, array $options = []): array
    {
        $response = $this->request($method, $path, $options);
        $payload = $response['data'] ?? null;

        return \is_array($payload) ? $payload : [];
    }

    /**
     * @param array<string, mixed> $options
     *
     * @return array<string, mixed>
     */
    private function request(string $method, string $path, array $options = []): array
    {
        $token = $this->settingsManager->getApiToken();
        if (null === $token) {
            throw new VideoOptimizerException('VideoOptimizer API token is not configured.', 428);
        }

        $options['headers'] = array_merge(
            ['Authorization' => 'Bearer ' . $token, 'Accept' => 'application/json'],
            $options['headers'] ?? [],
        );

        $url = rtrim($this->baseUrl, '/') . $path;

        for ($attempt = 0; ; ++$attempt) {
            try {
                $response = $this->httpClient->request($method, $url, $options);
                $status = $response->getStatusCode();
                $content = $response->getContent(false);
            } catch (\Throwable $e) {
                throw new VideoOptimizerException('Could not reach VideoOptimizer: ' . $e->getMessage(), 0, $e);
            }

            // Respect Retry-After once on a rate-limited request; paginated loops can trip the limit.
            if (429 === $status && 0 === $attempt) {
                sleep($this->retryAfterSeconds($response));

                continue;
            }

            break;
        }

        $decoded = '' === $content ? [] : json_decode($content, true);
        if (!\is_array($decoded)) {
            $decoded = [];
        }

        if ($status >= 400) {
            $message = 'VideoOptimizer request failed.';
            foreach (['message', 'statusMessage'] as $key) {
                if (\is_string($decoded[$key] ?? null) && '' !== $decoded[$key]) {
                    $message = $decoded[$key];

                    break;
                }
            }
            throw new VideoOptimizerException($message, $status);
        }

        return $decoded;
    }

    /**
     * Reads the Retry-After header (seconds), capped so a proxied admin request never blocks for long.
     */
    private function retryAfterSeconds(ResponseInterface $response): int
    {
        $value = $response->getHeaders(false)['retry-after'][0] ?? null;
        if (!\is_string($value) || !ctype_digit($value)) {
            return 1;
        }

        return min((int) $value, self::MAX_RETRY_AFTER);
    }
}
