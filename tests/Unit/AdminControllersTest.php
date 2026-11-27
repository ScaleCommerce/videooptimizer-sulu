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

    public function testChangingTheLadderDropsTheVideosCachedEmbedDataButRenamingDoesNot(): void
    {
        $resolver = $this->prophesize(VideoOptimizerEmbedResolver::class);
        $resolver->forget('v1')->shouldBeCalledTimes(2);

        $controller = new LibraryController($this->client(fn (string $method) => 'GET' === $method
            ? new MockResponse(json_encode(['data' => [['uuid' => 'v1']]], JSON_THROW_ON_ERROR))
            : new MockResponse(json_encode(['data' => ['id' => 'lib']], JSON_THROW_ON_ERROR))), $resolver->reveal());

        $controller->patch(new Request(content: '{"codec":"h264"}'), 'lib');
        $controller->patch(new Request(content: '{"resolutions":"720p"}'), 'lib');
        $controller->patch(new Request(content: '{"name":"Renamed"}'), 'lib');

        $resolver->checkProphecyMethodsPredictions();
    }

    public function testControllersWorkWithoutAnEmbedResolver(): void
    {
        $client = $this->client(fn () => new MockResponse(json_encode(['data' => []], JSON_THROW_ON_ERROR)));

        self::assertSame(200, (new LibraryController($client))->reprocess(new Request(), 'lib')->getStatusCode());
        self::assertSame(200, (new VideoController($client))->patch(new Request(content: '{}'), 'u')->getStatusCode());
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

    /**
     * @return iterable<string, array{int, string, string, string, bool}>
     */
    public static function upstreamAuthErrors(): iterable
    {
        yield '401 rejected token' => [401, 'Unauthorized', 'token_rejected', 'The VideoOptimizer API rejected the API token. Check the token under VideoOptimizer > Settings.', false];
        yield '403 plan limit keeps the API message' => [403, 'Library limit of your plan reached.', 'token_forbidden', 'Library limit of your plan reached.', true];
        yield '403 without message gets a hint' => [403, '', 'token_forbidden', 'The VideoOptimizer API token is not permitted to perform this action. Check the token permissions in VideoOptimizer.', false];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('upstreamAuthErrors')]
    public function testUpstreamAuthErrorsNeverReachTheAdminAs401Or403(int $upstream, string $apiMessage, string $code, string $message, bool $upstreamText): void
    {
        $body = '' === $apiMessage ? '{}' : json_encode(['message' => $apiMessage], JSON_THROW_ON_ERROR);
        $controller = new VideoController($this->client(fn () => new MockResponse($body, ['http_code' => $upstream])));

        $response = $controller->get('5c0a1e6e-7d3b-4c2a-9f10-0000000000de');

        // Sulu's admin treats a 401 as an expired session and would log the editor out.
        self::assertSame(502, $response->getStatusCode());
        $decoded = json_decode((string) $response->getContent(), true);
        self::assertSame($code, $decoded['code']);
        self::assertSame($message, $decoded['message']);
        self::assertSame($upstreamText, $decoded['upstream'] ?? false);
    }

    public function testVideoListIsPagedWhenALimitOrCursorIsGiven(): void
    {
        $urls = [];
        $controller = new VideoController($this->client(function (string $m, string $u) use (&$urls): MockResponse {
            $urls[] = $u;

            return new MockResponse(json_encode([
                'data' => [['uuid' => 'a']],
                'pagination' => ['next_cursor' => 'n1', 'has_more' => true],
            ], JSON_THROW_ON_ERROR));
        }));

        $response = $controller->list(new Request(['library_id' => 'lib', 'limit' => '60', 'cursor' => 'c0', 'tags' => 'promo']));

        self::assertSame(
            ['_embedded' => ['videos' => [['uuid' => 'a']]], 'next_cursor' => 'n1', 'has_more' => true],
            json_decode((string) $response->getContent(), true),
        );
        self::assertCount(1, $urls);
        self::assertStringContainsString('cursor=c0', $urls[0]);
        self::assertStringContainsString('tags=promo', $urls[0]);
    }

    public function testVideoListWithoutPagingParametersStillReturnsEveryVideo(): void
    {
        $calls = 0;
        $controller = new VideoController($this->client(function () use (&$calls): MockResponse {
            ++$calls;

            return new MockResponse(json_encode([
                'data' => [['uuid' => 'v' . $calls]],
                'pagination' => ['next_cursor' => 1 === $calls ? 'n' : null, 'has_more' => 1 === $calls],
            ], JSON_THROW_ON_ERROR));
        }));

        $decoded = json_decode((string) $controller->list(new Request())->getContent(), true);

        self::assertSame([['uuid' => 'v1'], ['uuid' => 'v2']], $decoded['_embedded']['videos']);
        self::assertArrayNotHasKey('has_more', $decoded);
    }

    public function testUnreachableApiIsReportedAs502WithACode(): void
    {
        $controller = new LibraryController($this->client(fn () => new MockResponse('', ['error' => 'timeout'])));

        $response = $controller->cget();

        self::assertSame(502, $response->getStatusCode());
        self::assertSame('unreachable', json_decode((string) $response->getContent(), true)['code']);
    }

    public function testConnectionTestExplainsARejectedToken(): void
    {
        $settings = $this->prophesize(SettingsManager::class);
        $controller = new \Scale\VideoOptimizerBundle\Controller\Admin\SettingsController(
            $settings->reveal(),
            $this->client(fn () => new MockResponse('{}', ['http_code' => 401])),
        );

        $decoded = json_decode((string) $controller->test()->getContent(), true);

        self::assertFalse($decoded['ok']);
        self::assertSame('token_rejected', $decoded['code']);
        self::assertStringContainsString('rejected the API token', $decoded['message']);
    }

    private function client(callable $callback): VideoOptimizerClient
    {
        $settings = $this->prophesize(SettingsManager::class);
        $settings->getApiToken()->willReturn('vp_test-token');

        return new VideoOptimizerClient(new MockHttpClient($callback), $settings->reveal(), 'https://api.videooptimizer.eu/api/v1');
    }
}
