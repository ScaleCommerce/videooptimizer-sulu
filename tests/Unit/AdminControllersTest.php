<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Prophecy\PhpUnit\ProphecyTrait;
use Scale\VideoOptimizerBundle\Api\VideoOptimizerClient;
use Scale\VideoOptimizerBundle\Controller\Admin\LibraryController;
use Scale\VideoOptimizerBundle\Controller\Admin\VideoController;
use Scale\VideoOptimizerBundle\Service\SettingsManager;
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
        }));

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
        }));

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
        }));

        self::assertSame(400, $controller->post(new Request(content: '{"name":"A","encoding_quality":"ultra"}'))->getStatusCode());
        self::assertSame(400, $controller->patch(new Request(content: '{"encoding_quality":null}'), 'l')->getStatusCode());
        self::assertSame(0, $calls);
    }

    public function testApiErrorCodeIsReturnedToTheAdmin(): void
    {
        $controller = new VideoController($this->client(fn () => new MockResponse(
            json_encode(['statusCode' => 400, 'message' => 'No video platforms.', 'data' => ['code' => 'source_url_video_platform']], JSON_THROW_ON_ERROR),
            ['http_code' => 400],
        )));

        $response = $controller->ingestUrl(new Request(content: '{"library_id":"l","source_url":"https://youtu.be/x"}'));

        self::assertSame(400, $response->getStatusCode());
        self::assertSame(['message' => 'No video platforms.', 'code' => 'source_url_video_platform'], json_decode((string) $response->getContent(), true));
    }

    private function client(callable $callback): VideoOptimizerClient
    {
        $settings = $this->prophesize(SettingsManager::class);
        $settings->getApiToken()->willReturn('vp_test-token');

        return new VideoOptimizerClient(new MockHttpClient($callback), $settings->reveal(), 'https://api.videooptimizer.eu/api/v1');
    }
}
