<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Prophecy\PhpUnit\ProphecyTrait;
use Scale\VideoOptimizerBundle\Api\VideoOptimizerClient;
use Scale\VideoOptimizerBundle\Controller\Admin\LibraryController;
use Scale\VideoOptimizerBundle\Controller\Admin\VideoController;
use Scale\VideoOptimizerBundle\Service\SettingsManager;
use Scale\VideoOptimizerBundle\Service\VideoOptimizerEmbedResolver;
use Symfony\Component\HttpClient\MockHttpClient;
use Symfony\Component\HttpClient\Response\MockResponse;
use Symfony\Component\HttpFoundation\Request;

class AdminControllersTest extends TestCase
{
    use ProphecyTrait;

    public function testReprocessForwardsForce(): void
    {
        $bodies = [];
        $controller = new LibraryController($this->client(function (string $m, string $u, array $o) use (&$bodies): MockResponse {
            $bodies[] = $o['body'] ?? '';

            return new MockResponse(json_encode(['data' => ['queued' => 2]], JSON_THROW_ON_ERROR));
        }), $this->prophesize(VideoOptimizerEmbedResolver::class)->reveal());

        $controller->reprocess(new Request(content: '{"force":true}'), 'lib-1');
        $controller->reprocess(new Request(content: '{"force":"yes"}'), 'lib-1');
        $controller->reprocess(new Request(), 'lib-1');

        self::assertSame(['force' => true], json_decode((string) $bodies[0], true));
        self::assertStringNotContainsString('force', (string) $bodies[1]);
        self::assertStringNotContainsString('force', (string) $bodies[2]);
    }

    public function testEncodingQualityIsPassedThroughOnCreateAndUpdate(): void
    {
        $bodies = [];
        $controller = new LibraryController($this->client(function (string $m, string $u, array $o) use (&$bodies): MockResponse {
            $bodies[] = json_decode((string) $o['body'], true);

            return new MockResponse(json_encode(['data' => ['id' => 'l']], JSON_THROW_ON_ERROR));
        }), $this->prophesize(VideoOptimizerEmbedResolver::class)->reveal());

        self::assertSame(201, $controller->post(new Request(content: '{"name":"A","encoding_quality":"quality"}'))->getStatusCode());
        self::assertSame(200, $controller->patch(new Request(content: '{"encoding_quality":"performance"}'), 'l')->getStatusCode());

        self::assertSame('quality', $bodies[0]['encoding_quality']);
        self::assertSame('performance', $bodies[1]['encoding_quality']);
    }

    public function testInvalidEncodingQualityIsRejectedWithoutCallingTheApi(): void
    {
        $calls = 0;
        $controller = new LibraryController($this->client(function () use (&$calls): MockResponse {
            ++$calls;

            return new MockResponse('{}');
        }), $this->prophesize(VideoOptimizerEmbedResolver::class)->reveal());

        self::assertSame(400, $controller->post(new Request(content: '{"name":"A","encoding_quality":"ultra"}'))->getStatusCode());
        self::assertSame(400, $controller->patch(new Request(content: '{"encoding_quality":null}'), 'l')->getStatusCode());
        self::assertSame(0, $calls);
    }

    public function testApiErrorCodeIsReturnedToTheAdmin(): void
    {
        $controller = new VideoController($this->client(fn () => new MockResponse(
            json_encode(['statusCode' => 400, 'message' => 'No video platforms.', 'data' => ['code' => 'source_url_video_platform']], JSON_THROW_ON_ERROR),
            ['http_code' => 400],
        )), $this->prophesize(VideoOptimizerEmbedResolver::class)->reveal());

        $response = $controller->ingestUrl(new Request(content: '{"library_id":"l","source_url":"https://youtu.be/x"}'));

        self::assertSame(400, $response->getStatusCode());
        self::assertSame(['message' => 'No video platforms.', 'code' => 'source_url_video_platform'], json_decode((string) $response->getContent(), true));
    }

    public function testChangingOrDeletingAVideoDropsItsCachedEmbedData(): void
    {
        $uuid = '5c0a1e6e-7d3b-4c2a-9f10-0000000000de';
        $resolver = $this->prophesize(VideoOptimizerEmbedResolver::class);
        $resolver->forget($uuid)->shouldBeCalledTimes(5);

        $controller = new VideoController($this->client(fn () => new MockResponse(json_encode(['data' => ['uuid' => $uuid]], JSON_THROW_ON_ERROR))), $resolver->reveal());

        $controller->patch(new Request(content: '{"title":"New"}'), $uuid);
        $controller->selectThumbnail(new Request(content: '{"thumbnailIndex":2}'), $uuid);
        $controller->posterComplete(new Request(content: '{"key":"k"}'), $uuid);
        $controller->posterSelect(new Request(content: '{"source":"custom"}'), $uuid);
        $controller->delete($uuid);

        $resolver->checkProphecyMethodsPredictions();
    }

    public function testDeletingOrReprocessingALibraryDropsItsVideosCachedEmbedData(): void
    {
        $resolver = $this->prophesize(VideoOptimizerEmbedResolver::class);
        $resolver->forget('v1')->shouldBeCalledTimes(2);
        $resolver->forget('v2')->shouldBeCalledTimes(2);

        $controller = new LibraryController($this->client(function (string $method, string $url): MockResponse {
            if ('GET' === $method) {
                return new MockResponse(json_encode(['data' => [['uuid' => 'v1'], ['uuid' => 'v2']]], JSON_THROW_ON_ERROR));
            }

            return new MockResponse(json_encode(['data' => ['queued' => 2]], JSON_THROW_ON_ERROR));
        }), $resolver->reveal());

        $controller->reprocess(new Request(), 'lib');
        $controller->delete('lib');

        $resolver->checkProphecyMethodsPredictions();
    }

    public function testLibraryDeleteStillWorksWhenTheVideoListIsUnavailable(): void
    {
        $resolver = $this->prophesize(VideoOptimizerEmbedResolver::class);
        $controller = new LibraryController($this->client(fn (string $method) => 'GET' === $method
            ? new MockResponse('{}', ['http_code' => 500])
            : new MockResponse('', ['http_code' => 204])), $resolver->reveal());

        self::assertSame(204, $controller->delete('lib')->getStatusCode());
    }

    public function testApiErrorLeavesTheCachedEmbedDataAlone(): void
    {
        $resolver = $this->prophesize(VideoOptimizerEmbedResolver::class);
        $resolver->forget('u')->shouldNotBeCalled();

        $controller = new VideoController($this->client(fn () => new MockResponse('{}', ['http_code' => 500])), $resolver->reveal());
        $controller->patch(new Request(content: '{}'), 'u');

        $resolver->checkProphecyMethodsPredictions();
    }

    private function client(callable $callback): VideoOptimizerClient
    {
        $settings = $this->prophesize(SettingsManager::class);
        $settings->getApiToken()->willReturn('vp_test-token');

        return new VideoOptimizerClient(new MockHttpClient($callback), $settings->reveal(), 'https://api.videooptimizer.eu/api/v1');
    }
}
