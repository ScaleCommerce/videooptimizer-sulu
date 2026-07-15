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

    private function client(MockHttpClient $httpClient): VideoOptimizerClient
    {
        $settings = $this->prophesize(SettingsManager::class);
        $settings->getApiToken()->willReturn('vp_test-token');

        return new VideoOptimizerClient($httpClient, $settings->reveal(), 'https://api.videooptimizer.eu/api/v1');
    }
}
