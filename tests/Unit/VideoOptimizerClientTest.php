<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Prophecy\PhpUnit\ProphecyTrait;
use Scale\VideoOptimizerBundle\Api\UserAgentProvider;
use Scale\VideoOptimizerBundle\Api\VideoOptimizerClient;
use Scale\VideoOptimizerBundle\Api\VideoOptimizerException;
use Scale\VideoOptimizerBundle\Service\SettingsManager;
use Symfony\Component\HttpClient\MockHttpClient;
use Symfony\Component\HttpClient\Response\MockResponse;

class VideoOptimizerClientTest extends TestCase
{
    use ProphecyTrait;

    public function testListVideosFollowsCursorAndMergesPages(): void
    {
        $requestedUrls = [];
        $pages = [
            new MockResponse(json_encode([
                'data' => [['uuid' => 'a'], ['uuid' => 'b']],
                'pagination' => ['next_cursor' => 'cursor-2', 'has_more' => true],
            ], JSON_THROW_ON_ERROR)),
            new MockResponse(json_encode([
                'data' => [['uuid' => 'c']],
                'pagination' => ['next_cursor' => null, 'has_more' => false],
            ], JSON_THROW_ON_ERROR)),
        ];

        $httpClient = new MockHttpClient(function (string $method, string $url) use (&$requestedUrls, &$pages): MockResponse {
            $requestedUrls[] = $url;

            return array_shift($pages);
        });

        $videos = $this->client($httpClient)->listVideos('lib-1');

        self::assertSame([['uuid' => 'a'], ['uuid' => 'b'], ['uuid' => 'c']], $videos);
        self::assertCount(2, $requestedUrls, 'The client must request both pages.');
        self::assertStringContainsString('limit=100', $requestedUrls[0]);
        self::assertStringContainsString('cursor=cursor-2', $requestedUrls[1], 'The second request must carry the next cursor.');
    }

    public function testListTagsReturnsTheOrganizationsTags(): void
    {
        $url = '';
        $httpClient = new MockHttpClient(function (string $method, string $u) use (&$url): MockResponse {
            $url = $u;

            return new MockResponse(json_encode(['data' => [['name' => 'promo', 'video_count' => 2], 'junk']], JSON_THROW_ON_ERROR));
        });

        self::assertSame([['name' => 'promo', 'video_count' => 2]], $this->client($httpClient)->listTags());
        self::assertStringEndsWith('/api/v1/tags', $url);
    }

    public function testListVideosPageFetchesExactlyOnePageWithCursorLimitAndFilters(): void
    {
        $requestedUrls = [];
        $httpClient = new MockHttpClient(function (string $method, string $url) use (&$requestedUrls): MockResponse {
            $requestedUrls[] = $url;

            return new MockResponse(json_encode([
                'data' => [['uuid' => 'a'], 'junk', ['uuid' => 'b']],
                'pagination' => ['next_cursor' => 'next-1', 'has_more' => true],
            ], JSON_THROW_ON_ERROR));
        });

        $page = $this->client($httpClient)->listVideosPage('lib-7', 'cur-0', 60, 'promo,2026');

        self::assertSame([['uuid' => 'a'], ['uuid' => 'b']], $page['videos']);
        self::assertSame('next-1', $page['next_cursor']);
        self::assertTrue($page['has_more']);
        self::assertCount(1, $requestedUrls, 'Only the requested page is fetched.');
        self::assertStringContainsString('limit=60', $requestedUrls[0]);
        self::assertStringContainsString('cursor=cur-0', $requestedUrls[0]);
        self::assertStringContainsString('library_id=lib-7', $requestedUrls[0]);
        self::assertStringContainsString('tags=promo%2C2026', $requestedUrls[0]);
    }

    public function testListVideosPageOfTheLastPageHasNoCursor(): void
    {
        $httpClient = new MockHttpClient(fn () => new MockResponse(json_encode([
            'data' => [['uuid' => 'a']],
            'pagination' => ['next_cursor' => null, 'has_more' => false],
        ], JSON_THROW_ON_ERROR)));

        $page = $this->client($httpClient)->listVideosPage(null, null, 500);

        self::assertFalse($page['has_more']);
        self::assertNull($page['next_cursor']);
    }

    public function testListVideosPageCapsTheLimitAtTheApiMaximum(): void
    {
        $url = '';
        $httpClient = new MockHttpClient(function (string $method, string $u) use (&$url): MockResponse {
            $url = $u;

            return new MockResponse('{"data":[]}');
        });

        $this->client($httpClient)->listVideosPage(null, null, 500);

        self::assertStringContainsString('limit=100', $url);
    }

    public function testListAllVideosHitsGlobalEndpointWithoutLibraryFilter(): void
    {
        $requestedUrls = [];
        $httpClient = new MockHttpClient(function (string $method, string $url) use (&$requestedUrls): MockResponse {
            $requestedUrls[] = $url;

            return new MockResponse(json_encode([
                'data' => [['uuid' => 'a'], ['uuid' => 'b']],
                'pagination' => ['next_cursor' => null, 'has_more' => false],
            ], JSON_THROW_ON_ERROR));
        });

        $videos = $this->client($httpClient)->listAllVideos();

        self::assertSame([['uuid' => 'a'], ['uuid' => 'b']], $videos);
        self::assertStringContainsString('/api/v1/videos?', $requestedUrls[0]);
        self::assertStringNotContainsString('library_id', $requestedUrls[0], 'No filter must be sent when no library is given.');
    }

    public function testListAllVideosPropagatesLibraryFilterOnEveryPage(): void
    {
        $requestedUrls = [];
        $pages = [
            new MockResponse(json_encode([
                'data' => [['uuid' => 'a']],
                'pagination' => ['next_cursor' => 'c2', 'has_more' => true],
            ], JSON_THROW_ON_ERROR)),
            new MockResponse(json_encode([
                'data' => [['uuid' => 'b']],
                'pagination' => ['next_cursor' => null, 'has_more' => false],
            ], JSON_THROW_ON_ERROR)),
        ];
        $httpClient = new MockHttpClient(function (string $method, string $url) use (&$requestedUrls, &$pages): MockResponse {
            $requestedUrls[] = $url;

            return array_shift($pages);
        });

        $videos = $this->client($httpClient)->listAllVideos('lib-7');

        self::assertSame([['uuid' => 'a'], ['uuid' => 'b']], $videos);
        self::assertCount(2, $requestedUrls);
        self::assertStringContainsString('library_id=lib-7', $requestedUrls[0]);
        self::assertStringContainsString('library_id=lib-7', $requestedUrls[1], 'The filter must persist across paginated requests.');
        self::assertStringContainsString('cursor=c2', $requestedUrls[1]);
    }

    public function testListLibrariesStopsAfterSinglePageWithoutPagination(): void
    {
        $calls = 0;
        $httpClient = new MockHttpClient(function () use (&$calls): MockResponse {
            ++$calls;

            return new MockResponse(json_encode([
                'data' => [['id' => 'x']],
            ], JSON_THROW_ON_ERROR));
        });

        $libraries = $this->client($httpClient)->listLibraries();

        self::assertSame([['id' => 'x']], $libraries);
        self::assertSame(1, $calls, 'Without pagination metadata the client must not request further pages.');
    }

    public function testUpdateVideoSendsPatchWithPayload(): void
    {
        $captured = null;
        $httpClient = new MockHttpClient(function (string $method, string $url, array $options) use (&$captured): MockResponse {
            $captured = ['method' => $method, 'url' => $url, 'body' => $options['body'] ?? null];

            return new MockResponse(json_encode(['data' => ['uuid' => 'v1', 'title' => 'New']], JSON_THROW_ON_ERROR));
        });

        $result = $this->client($httpClient)->updateVideo('v1', ['title' => 'New', 'option' => ['loop' => true]]);

        self::assertSame('PATCH', $captured['method']);
        self::assertStringEndsWith('/videos/v1', $captured['url']);
        self::assertStringContainsString('"title":"New"', (string) $captured['body']);
        self::assertSame(['uuid' => 'v1', 'title' => 'New'], $result);
    }

    public function testSelectThumbnailPostsIndex(): void
    {
        $captured = null;
        $httpClient = new MockHttpClient(function (string $method, string $url, array $options) use (&$captured): MockResponse {
            $captured = ['method' => $method, 'url' => $url, 'body' => $options['body'] ?? null];

            return new MockResponse(json_encode(['data' => ['success' => true, 'selected_thumbnail' => '3']], JSON_THROW_ON_ERROR));
        });

        $result = $this->client($httpClient)->selectThumbnail('v1', 3);

        self::assertSame('POST', $captured['method']);
        self::assertStringEndsWith('/videos/v1/thumbnail', $captured['url']);
        self::assertStringContainsString('"thumbnailIndex":3', (string) $captured['body']);
        self::assertTrue($result['success']);
    }

    public function testListThumbnailsReturnsDataObject(): void
    {
        $httpClient = new MockHttpClient(fn () => new MockResponse(json_encode([
            'data' => ['thumbnails' => [['index' => 0, 'url' => 'https://cdn/0.jpg']]],
        ], JSON_THROW_ON_ERROR)));

        $result = $this->client($httpClient)->listThumbnails('v1');

        self::assertSame([['index' => 0, 'url' => 'https://cdn/0.jpg']], $result['thumbnails']);
    }

    public function testIngestVideoUrlPostsJson(): void
    {
        $captured = null;
        $httpClient = new MockHttpClient(function (string $method, string $url, array $options) use (&$captured): MockResponse {
            $captured = ['method' => $method, 'url' => $url, 'body' => $options['body'] ?? null];

            return new MockResponse(json_encode(['data' => ['uuid' => 'v9', 'status' => 'processing']], JSON_THROW_ON_ERROR));
        });

        $result = $this->client($httpClient)->ingestVideoUrl(['library_id' => 'lib', 'source_url' => 'https://x/v.mp4', 'title' => 'T']);

        self::assertSame('POST', $captured['method']);
        self::assertStringEndsWith('/videos', $captured['url']);
        self::assertStringContainsString('"source_url":"https:\/\/x\/v.mp4"', (string) $captured['body']);
        self::assertSame('processing', $result['status']);
    }

    public function testReprocessLibraryPostsAndReturnsQueued(): void
    {
        $captured = null;
        $httpClient = new MockHttpClient(function (string $method, string $url) use (&$captured): MockResponse {
            $captured = ['method' => $method, 'url' => $url];

            return new MockResponse(json_encode(['data' => ['queued' => 7]], JSON_THROW_ON_ERROR));
        });

        $result = $this->client($httpClient)->reprocessLibrary('lib-1');

        self::assertSame('POST', $captured['method']);
        self::assertStringEndsWith('/libraries/lib-1/reprocess', $captured['url']);
        self::assertSame(7, $result['queued']);
    }

    public function testReprocessLibraryDoesNotSendForceByDefault(): void
    {
        $captured = null;
        $httpClient = new MockHttpClient(function (string $method, string $url, array $options) use (&$captured): MockResponse {
            $captured = $options;

            return new MockResponse(json_encode(['data' => ['queued' => 1]], JSON_THROW_ON_ERROR));
        });

        $this->client($httpClient)->reprocessLibrary('lib-1');

        self::assertStringNotContainsString('force', (string) ($captured['body'] ?? ''));
    }

    public function testReprocessLibraryForceSendsForceTrue(): void
    {
        $captured = null;
        $httpClient = new MockHttpClient(function (string $method, string $url, array $options) use (&$captured): MockResponse {
            $captured = $options;

            return new MockResponse(json_encode(['data' => ['queued' => 3]], JSON_THROW_ON_ERROR));
        });

        $result = $this->client($httpClient)->reprocessLibrary('lib-1', true);

        self::assertSame(['force' => true], json_decode((string) $captured['body'], true));
        self::assertSame(3, $result['queued']);
    }

    public function testApiErrorCodeIsExposedOnTheException(): void
    {
        $httpClient = new MockHttpClient(fn () => new MockResponse(
            json_encode(['statusCode' => 400, 'message' => 'Video platform links are not supported.', 'data' => ['code' => 'source_url_video_platform']], JSON_THROW_ON_ERROR),
            ['http_code' => 400],
        ));

        try {
            $this->client($httpClient)->ingestVideoUrl(['library_id' => 'l', 'source_url' => 'https://youtu.be/x']);
            self::fail('Expected an exception.');
        } catch (VideoOptimizerException $e) {
            self::assertSame(400, $e->getStatusCode());
            self::assertSame('source_url_video_platform', $e->getApiCode());
            self::assertSame('Video platform links are not supported.', $e->getMessage());
        }
    }

    public function testListEncodingsReturnsRawPayload(): void
    {
        $captured = null;
        $httpClient = new MockHttpClient(function (string $method, string $url) use (&$captured): MockResponse {
            $captured = ['method' => $method, 'url' => $url];

            // Unlike the list endpoints, /encodings is NOT wrapped in { data }.
            return new MockResponse(json_encode([
                'codecs' => [['key' => 'h264', 'label' => 'H.264/AVC', 'access' => 'included', 'available' => true]],
                'resolutions' => [['key' => '1080p', 'label' => '1080p', 'access' => 'included', 'available' => true]],
            ], JSON_THROW_ON_ERROR));
        });

        $result = $this->client($httpClient)->listEncodings();

        self::assertSame('GET', $captured['method']);
        self::assertStringEndsWith('/encodings', $captured['url']);
        self::assertSame('h264', $result['codecs'][0]['key']);
        self::assertSame('1080p', $result['resolutions'][0]['key']);
    }

    public function testEveryRequestCarriesThePluginUserAgent(): void
    {
        $userAgents = [];
        $httpClient = new MockHttpClient(function (string $method, string $url, array $options) use (&$userAgents): MockResponse {
            foreach ($options['headers'] ?? [] as $header) {
                if (\is_string($header) && str_starts_with(strtolower($header), 'user-agent:')) {
                    $userAgents[] = trim(substr($header, \strlen('user-agent:')));
                }
            }

            return new MockResponse(json_encode(['data' => []], JSON_THROW_ON_ERROR));
        });

        $userAgent = new UserAgentProvider(null, 'https://www.example.com', static fn (string $package): ?string => [
            'scalecommerce/videooptimizer-sulu' => 'v1.7.3',
            'sulu/sulu' => '3.0.7',
        ][$package] ?? null, '8.3.14');
        $settings = $this->prophesize(SettingsManager::class);
        $settings->getApiToken()->willReturn('vp_test-token');
        $client = new VideoOptimizerClient($httpClient, $settings->reveal(), 'https://api.videooptimizer.eu/api/v1', $userAgent);

        $client->listLibraries();
        $client->getEmbed('v1');
        $client->deleteVideo('v1');

        self::assertSame(array_fill(0, 3, 'VideoOptimizer-Sulu/1.7.3 (Sulu 3.0.7; PHP 8.3.14; +https://www.example.com)'), $userAgents);
    }

    public function testTransportErrorsBecomeANeutralBadGatewayWithoutTheUpstreamUrl(): void
    {
        $httpClient = new MockHttpClient(fn () => new MockResponse('', ['error' => 'Could not resolve host: api.videooptimizer.eu (secret-detail)']));

        try {
            $this->client($httpClient)->listLibraries();
            self::fail('Expected an exception.');
        } catch (VideoOptimizerException $e) {
            self::assertSame(502, $e->getStatusCode());
            self::assertSame('unreachable', $e->getApiCode());
            self::assertStringNotContainsString('secret-detail', $e->getMessage());
            self::assertStringNotContainsString('videooptimizer.eu', $e->getMessage());
        }
    }

    public function testRateLimitedRequestIsRetriedOnceAfterRetryAfter(): void
    {
        $calls = 0;
        $httpClient = new MockHttpClient(function () use (&$calls): MockResponse {
            ++$calls;

            return 1 === $calls
                ? new MockResponse('{}', ['http_code' => 429, 'response_headers' => ['Retry-After: 0']])
                : new MockResponse(json_encode(['data' => []], JSON_THROW_ON_ERROR));
        });

        self::assertSame([], $this->client($httpClient)->listLibraries());
        self::assertSame(2, $calls);
    }

    public function testEmbedLookupDuringRenderingNeverSleepsOnRateLimit(): void
    {
        $calls = 0;
        $httpClient = new MockHttpClient(function () use (&$calls): MockResponse {
            ++$calls;

            return new MockResponse('{}', ['http_code' => 429, 'response_headers' => ['Retry-After: 5']]);
        });

        $started = microtime(true);
        try {
            $this->client($httpClient)->getEmbed('v1');
            self::fail('Expected an exception.');
        } catch (VideoOptimizerException $e) {
            self::assertSame(429, $e->getStatusCode());
        }

        self::assertSame(1, $calls);
        self::assertLessThan(1.0, microtime(true) - $started);
    }

    private function client(MockHttpClient $httpClient): VideoOptimizerClient
    {
        $settings = $this->prophesize(SettingsManager::class);
        $settings->getApiToken()->willReturn('vp_test-token');

        return new VideoOptimizerClient($httpClient, $settings->reveal(), 'https://api.videooptimizer.eu/api/v1');
    }
}
