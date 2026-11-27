<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Api;

use Scale\VideoOptimizerBundle\Service\SettingsManager;
use Psr\Log\LoggerInterface;
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
        private ?UserAgentProvider $userAgentProvider = null,
        private ?LoggerInterface $logger = null,
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
     * Re-queues encoding for every video in a library (selfhosted only). Returns {queued}.
     * Finished renditions are kept unless $force is set, which is needed after changing `encoding_quality`.
     *
     * @return array<string, mixed>
     */
    public function reprocessLibrary(string $id, bool $force = false): array
    {
        return $this->requestData('POST', '/libraries/' . rawurlencode($id) . '/reprocess', $force ? ['json' => ['force' => true]] : []);
    }

    /**
     * Lists the codecs and resolutions the organization may enable on a library. Unlike the other
     * list endpoints this returns the payload as-is ({codecs, resolutions}), not wrapped in { data }.
     *
     * @return array<string, mixed>
     */
    public function listEncodings(): array
    {
        return $this->request('GET', '/encodings');
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listVideos(string $libraryId): array
    {
        return $this->requestAllPages('/libraries/' . rawurlencode($libraryId) . '/videos');
    }

    /**
     * Lists videos across every library, newest first. Optionally filtered to one library.
     *
     * @return array<int, array<string, mixed>>
     */
    public function listAllVideos(?string $libraryId = null): array
    {
        $query = (null !== $libraryId && '' !== $libraryId) ? ['library_id' => $libraryId] : [];

        return $this->requestAllPages('/videos', $query);
    }

    /**
     * Fetches ONE page of the org-wide video list (newest first) for the admin's "load more" paging.
     *
     * @param string|null $tags comma-separated tag names: only videos carrying all of them
     *
     * @return array{videos: array<int, array<string, mixed>>, next_cursor: ?string, has_more: bool}
     */
    public function listVideosPage(?string $libraryId, ?string $cursor, int $limit, ?string $tags = null): array
    {
        $query = ['limit' => max(1, min($limit, self::PAGE_LIMIT))];
        if (null !== $libraryId && '' !== $libraryId) {
            $query['library_id'] = $libraryId;
        }
        if (null !== $cursor && '' !== $cursor) {
            $query['cursor'] = $cursor;
        }
        if (null !== $tags && '' !== trim($tags)) {
            $query['tags'] = trim($tags);
        }

        $response = $this->request('GET', '/videos', ['query' => $query]);

        $videos = [];
        foreach (\is_array($response['data'] ?? null) ? $response['data'] : [] as $item) {
            if (\is_array($item)) {
                /** @var array<string, mixed> $item */
                $videos[] = $item;
            }
        }
        $pagination = \is_array($response['pagination'] ?? null) ? $response['pagination'] : [];
        $next = \is_string($pagination['next_cursor'] ?? null) && '' !== $pagination['next_cursor'] ? $pagination['next_cursor'] : null;

        return ['videos' => $videos, 'next_cursor' => $next, 'has_more' => true === ($pagination['has_more'] ?? false) && null !== $next];
    }

    /**
     * @return array<string, mixed>
     */
    public function getVideo(string $uuid): array
    {
        return $this->requestData('GET', '/videos/' . rawurlencode($uuid));
    }

    /**
     * @return array<int, array<string, mixed>> one entry per language: {language, label, kind, is_default, cue_count, source_format, origin, updated_at}
     */
    public function listSubtitles(string $uuid): array
    {
        return $this->listOf($this->requestData('GET', '/videos/' . rawurlencode($uuid) . '/subtitles'));
    }

    /**
     * Uploads or replaces the subtitle of one language (SRT or WebVTT, max. 2 MB). The file is sent as a
     * multipart form; the language must be one of the organization's subtitle languages.
     *
     * @return array<string, mixed> {subtitle, skipped_cues}
     */
    public function uploadSubtitle(string $uuid, string $filename, string $content, string $language, ?string $kind = null, ?bool $isDefault = null): array
    {
        $fields = ['language' => self::assertLanguageCode($language)];
        if (\in_array($kind, ['subtitles', 'captions'], true)) {
            $fields['kind'] = $kind;
        }
        if (null !== $isDefault) {
            $fields['is_default'] = $isDefault ? 'true' : 'false';
        }

        $boundary = 'vo' . bin2hex(random_bytes(16));
        $body = '';
        foreach ($fields as $name => $value) {
            $body .= '--' . $boundary . "\r\nContent-Disposition: form-data; name=\"" . $name . "\"\r\n\r\n" . $value . "\r\n";
        }
        // Whitelist the filename: it ends up inside a header line.
        $safeName = trim((string) preg_replace('/[^A-Za-z0-9._ -]+/', '_', $filename));
        $body .= '--' . $boundary . "\r\nContent-Disposition: form-data; name=\"file\"; filename=\"" . ('' === $safeName ? 'subtitle.vtt' : $safeName) . "\"\r\nContent-Type: application/octet-stream\r\n\r\n" . $content . "\r\n";
        $body .= '--' . $boundary . "--\r\n";

        return $this->requestData('POST', '/videos/' . rawurlencode($uuid) . '/subtitles', [
            'headers' => ['Content-Type' => 'multipart/form-data; boundary=' . $boundary],
            'body' => $body,
        ]);
    }

    /**
     * The stored WebVTT file (SRT uploads come back converted).
     */
    public function downloadSubtitle(string $uuid, string $language): string
    {
        return $this->requestRaw('GET', '/videos/' . rawurlencode($uuid) . '/subtitles/' . rawurlencode(self::assertLanguageCode($language)));
    }

    public function deleteSubtitle(string $uuid, string $language): void
    {
        $this->request('DELETE', '/videos/' . rawurlencode($uuid) . '/subtitles/' . rawurlencode(self::assertLanguageCode($language)));
    }

    /**
     * The organization's subtitle languages, in player order: {code, label, video_count}.
     *
     * @return array<int, array<string, mixed>>
     */
    public function listSubtitleLanguages(): array
    {
        return $this->listOf($this->requestData('GET', '/subtitle-languages'));
    }

    /**
     * @return array<string, mixed> {code, label}
     */
    public function createSubtitleLanguage(string $code, ?string $label = null): array
    {
        $payload = ['code' => self::assertLanguageCode($code)];
        if (null !== $label && '' !== trim($label)) {
            $payload['label'] = trim($label);
        }

        return $this->requestData('POST', '/subtitle-languages', ['json' => $payload]);
    }

    /**
     * Refused with 409 `subtitle_language_in_use` while videos still carry subtitles in the language.
     */
    public function deleteSubtitleLanguage(string $code): void
    {
        $this->request('DELETE', '/subtitle-languages/' . rawurlencode(self::assertLanguageCode($code)));
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
        return $this->requestData('GET', '/embed/' . rawurlencode($uuid), ['max_duration' => 3.0], false);
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
     * Remote-URL ingest: creates a video from a public https URL (selfhosted libraries only).
     *
     * @param array<string, mixed> $payload expects library_id, source_url, optional title
     *
     * @return array<string, mixed> {uuid, status}
     */
    public function ingestVideoUrl(array $payload): array
    {
        return $this->requestData('POST', '/videos', ['json' => $payload]);
    }

    /**
     * Fetches every page of a cursor-paginated list endpoint and returns the merged items.
     *
     * @param array<string, mixed> $extraQuery additional query params applied to every page request
     *
     * @return array<int, array<string, mixed>>
     */
    private function requestAllPages(string $path, array $extraQuery = []): array
    {
        /** @var array<int, array<string, mixed>> $items */
        $items = [];
        $cursor = null;
        $previousCursor = null;

        for ($page = 0; $page < self::MAX_PAGES; ++$page) {
            $query = $extraQuery + ['limit' => self::PAGE_LIMIT];
            if (null !== $cursor) {
                $query['cursor'] = $cursor;
            }

            $response = $this->request('GET', $path, ['query' => $query]);

            $data = $response['data'] ?? null;
            if (\is_array($data)) {
                foreach ($data as $item) {
                    if (\is_array($item)) {
                        /** @var array<string, mixed> $item */
                        $items[] = $item;
                    }
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
     * @return array<string, mixed>
     */
    private function requestData(string $method, string $path, array $options = [], bool $retryOnRateLimit = true): array
    {
        $response = $this->request($method, $path, $options, $retryOnRateLimit);
        $payload = $response['data'] ?? null;
        if (!\is_array($payload)) {
            return [];
        }

        /** @var array<string, mixed> $payload */
        return $payload;
    }

    /**
     * Keeps only the object entries of a `{ data: [...] }` list payload.
     *
     * @param array<mixed> $data
     *
     * @return array<int, array<string, mixed>>
     */
    private function listOf(array $data): array
    {
        $items = [];
        foreach ($data as $item) {
            if (\is_array($item)) {
                /** @var array<string, mixed> $item */
                $items[] = $item;
            }
        }

        return $items;
    }

    /**
     * BCP 47 tag as used in the subtitle endpoints (e.g. `de`, `en-US`, `de-x-simple`).
     */
    private static function assertLanguageCode(string $code): string
    {
        if (1 !== preg_match('/^[A-Za-z0-9_-]{1,35}$/', $code)) {
            throw new VideoOptimizerException('Invalid subtitle language code.', 400);
        }

        return $code;
    }

    /**
     * @param array<string, mixed> $options
     * @param bool                 $retryOnRateLimit wait for Retry-After once on a 429; off while rendering pages, where a sleep would hold the response open
     *
     * @return array<string, mixed>
     */
    private function request(string $method, string $path, array $options = [], bool $retryOnRateLimit = true): array
    {
        [$status, $content] = $this->execute($method, $path, $options, $retryOnRateLimit);
        $decoded = $this->decode($content);

        if ($status >= 400) {
            throw $this->failure($status, $decoded);
        }

        return $decoded;
    }

    /**
     * Like request() for endpoints that answer with a file instead of JSON (e.g. a WebVTT download).
     *
     * @param array<string, mixed> $options
     */
    private function requestRaw(string $method, string $path, array $options = []): string
    {
        [$status, $content] = $this->execute($method, $path, $options, true);
        if ($status >= 400) {
            throw $this->failure($status, $this->decode($content));
        }

        return $content;
    }

    /**
     * Sends the request with token, User-Agent and base URL checks; retries a 429 once. Redirects
     * are not followed and reported as an error, so the token never leaves the configured host.
     *
     * @param array<string, mixed> $options
     *
     * @return array{0: int, 1: string} status and raw body
     */
    private function execute(string $method, string $path, array $options, bool $retryOnRateLimit): array
    {
        $token = $this->settingsManager->getApiToken();
        if (null === $token) {
            throw new VideoOptimizerException('VideoOptimizer API token is not configured.', 428);
        }

        // Every request identifies the bundle, Sulu/PHP version and site (see UserAgentProvider).
        $this->userAgentProvider ??= new UserAgentProvider();
        $options['headers'] = array_merge(
            [
                'Authorization' => 'Bearer ' . $token,
                'Accept' => 'application/json',
                'User-Agent' => $this->userAgentProvider->getUserAgent(),
            ],
            (array) ($options['headers'] ?? []),
        );

        try {
            BaseUrlGuard::assertHttps($this->baseUrl, 'API base URL');
        } catch (\InvalidArgumentException $e) {
            $this->logger?->warning($e->getMessage(), ['url' => $this->baseUrl]);

            throw new VideoOptimizerException($e->getMessage(), 0, $e);
        }

        // The token must never follow a redirect to another host.
        $options['max_redirects'] = 0;

        $url = rtrim($this->baseUrl, '/') . $path;

        for ($attempt = 0; ; ++$attempt) {
            try {
                $response = $this->httpClient->request($method, $url, $options);
                $status = $response->getStatusCode();
                $content = $response->getContent(false);
            } catch (\Throwable $e) {
                // The transport message names the full upstream URL: log it, show a neutral text.
                $this->logger?->warning('VideoOptimizer API could not be reached.', ['method' => $method, 'url' => $url, 'error' => $e->getMessage()]);

                throw new VideoOptimizerException('The VideoOptimizer API could not be reached or did not respond in time.', 502, $e, 'unreachable');
            }

            // Respect Retry-After once on a rate-limited request; paginated loops can trip the limit.
            if (429 === $status && 0 === $attempt && $retryOnRateLimit) {
                sleep($this->retryAfterSeconds($response));

                continue;
            }

            break;
        }

        if ($status >= 300 && $status < 400) {
            throw new VideoOptimizerException('VideoOptimizer returned an unexpected redirect (HTTP ' . $status . '); check the configured API base URL.', $status);
        }

        return [$status, $content];
    }

    /**
     * @return array<string, mixed>
     */
    private function decode(string $content): array
    {
        $decoded = '' === $content ? [] : json_decode($content, true);
        if (!\is_array($decoded)) {
            return [];
        }

        /** @var array<string, mixed> $decoded */
        return $decoded;
    }

    /**
     * @param array<string, mixed> $decoded
     */
    private function failure(int $status, array $decoded): VideoOptimizerException
    {
        $message = 'VideoOptimizer request failed.';
        foreach (['message', 'statusMessage'] as $key) {
            if (\is_string($decoded[$key] ?? null) && '' !== $decoded[$key]) {
                $message = $decoded[$key];

                break;
            }
        }
        $data = $decoded['data'] ?? null;
        $apiCode = \is_array($data) && \is_string($data['code'] ?? null) && '' !== $data['code'] ? $data['code'] : null;

        return new VideoOptimizerException($message, $status, null, $apiCode);
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
