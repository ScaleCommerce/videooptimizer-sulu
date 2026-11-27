<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Prophecy\PhpUnit\ProphecyTrait;
use Scale\VideoOptimizerBundle\Api\VideoOptimizerClient;
use Scale\VideoOptimizerBundle\Api\VideoOptimizerException;
use Scale\VideoOptimizerBundle\Controller\Admin\SavingsController;
use Scale\VideoOptimizerBundle\Service\SettingsManager;
use Symfony\Component\HttpClient\MockHttpClient;
use Symfony\Component\HttpClient\Response\MockResponse;
use Symfony\Component\HttpFoundation\Request;

class SavingsTest extends TestCase
{
    use ProphecyTrait;

    private const SAVINGS = [
        'traffic_available' => true,
        'compression' => ['videos' => 12, 'original_bytes' => 1000, 'encoded_bytes' => 200, 'reduced_percent' => 80.0],
        'range' => ['from' => '2026-11-01', 'to' => '2026-11-30', 'delivered_bytes' => 500, 'estimated_original_bytes' => 2000, 'saved_bytes' => 1500, 'saved_percent' => 75.0],
        'all_time' => null,
    ];

    /** @var list<string> */
    private array $urls = [];

    public function testClientSendsTheRangeAndFilters(): void
    {
        $client = $this->client();

        $data = $client->getSavings('2026-11-01', '2026-11-30', 'lib-1', '5c0a1e6e-7d3b-4c2a-9f10-0000000000de');

        self::assertSame(12, $data['compression']['videos']);
        parse_str((string) parse_url($this->urls[0], \PHP_URL_QUERY), $query);
        self::assertSame(['from' => '2026-11-01', 'to' => '2026-11-30', 'library_id' => 'lib-1', 'video_uuid' => '5c0a1e6e-7d3b-4c2a-9f10-0000000000de'], $query);
        self::assertStringContainsString('/api/v1/savings?', $this->urls[0]);
    }

    public function testClientWithoutArgumentsSendsNoQuery(): void
    {
        $this->client()->getSavings();

        self::assertStringEndsWith('/api/v1/savings', $this->urls[0]);
    }

    public function testClientRejectsMalformedDatesAndIdsWithoutCallingTheApi(): void
    {
        $client = $this->client();

        foreach ([['2026-1-1', null, null, null], [null, '01.11.2026', null, null], [null, null, 'a/b', null], [null, null, null, 'x y']] as $args) {
            try {
                $client->getSavings(...$args);
                self::fail('Expected an exception.');
            } catch (VideoOptimizerException $e) {
                self::assertSame(400, $e->getStatusCode());
            }
        }
        self::assertSame([], $this->urls);
    }

    public function testControllerPassesTheQueryThrough(): void
    {
        $controller = new SavingsController($this->client());

        $response = $controller->get(new Request(['from' => '2026-11-01', 'to' => '2026-11-30', 'library_id' => 'lib-1']));

        self::assertEquals(self::SAVINGS, json_decode((string) $response->getContent(), true));
        self::assertStringContainsString('library_id=lib-1', $this->urls[0]);
    }

    public function testControllerMapsApiErrors(): void
    {
        $settings = $this->prophesize(SettingsManager::class);
        $settings->getApiToken()->willReturn('vp_x');
        $controller = new SavingsController(new VideoOptimizerClient(new MockHttpClient(fn () => new MockResponse('{"message":"Invalid date range"}', ['http_code' => 400])), $settings->reveal(), 'https://api.videooptimizer.eu/api/v1'));

        $response = $controller->get(new Request(['from' => '2026-11-30', 'to' => '2026-11-01']));

        self::assertSame(400, $response->getStatusCode());
        self::assertSame('Invalid date range', json_decode((string) $response->getContent(), true)['message']);
    }

    private function client(): VideoOptimizerClient
    {
        $settings = $this->prophesize(SettingsManager::class);
        $settings->getApiToken()->willReturn('vp_test-token');

        return new VideoOptimizerClient(new MockHttpClient(function (string $method, string $url): MockResponse {
            $this->urls[] = $url;

            return new MockResponse(json_encode(['data' => self::SAVINGS], JSON_THROW_ON_ERROR));
        }), $settings->reveal(), 'https://api.videooptimizer.eu/api/v1');
    }
}
