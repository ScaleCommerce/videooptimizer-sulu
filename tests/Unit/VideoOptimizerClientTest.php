<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Prophecy\PhpUnit\ProphecyTrait;
use Scale\VideoOptimizerBundle\Api\VideoOptimizerClient;
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

    private function client(MockHttpClient $httpClient): VideoOptimizerClient
    {
        $settings = $this->prophesize(SettingsManager::class);
        $settings->getApiToken()->willReturn('vp_test-token');

        return new VideoOptimizerClient($httpClient, $settings->reveal(), 'https://api.videooptimizer.eu/api/v1');
    }
}
