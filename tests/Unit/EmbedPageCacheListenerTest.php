<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Scale\VideoOptimizerBundle\Api\VideoOptimizerClient;
use Scale\VideoOptimizerBundle\Api\VideoOptimizerException;
use Scale\VideoOptimizerBundle\EventListener\EmbedPageCacheListener;
use Scale\VideoOptimizerBundle\Service\EmbedRenderState;
use Scale\VideoOptimizerBundle\Service\VideoOptimizerEmbedResolver;
use Symfony\Component\Cache\Adapter\ArrayAdapter;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\HttpKernelInterface;

class EmbedPageCacheListenerTest extends TestCase
{
    private function response(): Response
    {
        $response = new Response();
        $response->setPublic();
        $response->setMaxAge(86400);
        $response->setSharedMaxAge(86400);
        $response->headers->set('X-Reverse-Proxy-TTL', '86400');

        return $response;
    }

    private function fire(EmbedRenderState $state, Response $response, int $type = HttpKernelInterface::MAIN_REQUEST): void
    {
        $kernel = $this->createStub(HttpKernelInterface::class);
        (new EmbedPageCacheListener($state))->onKernelResponse(new ResponseEvent($kernel, new Request(), $type, $response));
    }

    public function testDegradedPageLifetimesAreCappedAtSixtySeconds(): void
    {
        $state = new EmbedRenderState();
        $state->markDegraded();
        $response = $this->response();

        $this->fire($state, $response);

        self::assertSame('60', $response->headers->getCacheControlDirective('s-maxage'));
        self::assertSame('60', $response->headers->getCacheControlDirective('max-age'));
        self::assertSame('60', $response->headers->get('X-Reverse-Proxy-TTL'));
        self::assertFalse($state->isDegraded(), 'State is reset after the response.');
    }

    public function testPagesWithAVideoListAreCappedAtTheListCacheLifetime(): void
    {
        $state = new EmbedRenderState();
        $state->capLifetime(120);
        $state->capLifetime(300); // the shortest cap wins
        $response = $this->response();

        $this->fire($state, $response);

        self::assertSame('120', $response->headers->getCacheControlDirective('s-maxage'));
        self::assertSame('120', $response->headers->getCacheControlDirective('max-age'));
        self::assertSame('120', $response->headers->get('X-Reverse-Proxy-TTL'));
        self::assertNull($state->maxLifetime(), 'State is reset after the response.');
    }

    public function testADegradedPageWithAListStillGetsTheShorterCap(): void
    {
        $state = new EmbedRenderState();
        $state->capLifetime(120);
        $state->markDegraded();
        $response = $this->response();

        $this->fire($state, $response);

        self::assertSame('60', $response->headers->getCacheControlDirective('s-maxage'));
    }

    public function testTemporaryStatesAreMarkedNoindex(): void
    {
        $state = new EmbedRenderState();
        $state->markNoIndex();
        $response = $this->response();

        $this->fire($state, $response);

        self::assertSame('noindex', $response->headers->get('X-Robots-Tag'));
        self::assertSame('86400', $response->headers->getCacheControlDirective('s-maxage'), 'Only the header changes.');
        self::assertFalse($state->isNoIndex());
    }

    public function testHealthyPageHasNoRobotsHeader(): void
    {
        $response = $this->response();

        $this->fire(new EmbedRenderState(), $response);

        self::assertFalse($response->headers->has('X-Robots-Tag'));
    }

    public function testHealthyPageKeepsItsLifetime(): void
    {
        $response = $this->response();

        $this->fire(new EmbedRenderState(), $response);

        self::assertSame('86400', $response->headers->getCacheControlDirective('s-maxage'));
        self::assertSame('86400', $response->headers->get('X-Reverse-Proxy-TTL'));
    }

    public function testShorterLifetimesAndUncachedResponsesAreNotExtended(): void
    {
        $state = new EmbedRenderState();
        $state->markDegraded();
        $response = new Response();
        $response->setPublic();
        $response->setSharedMaxAge(10);

        $this->fire($state, $response);

        self::assertSame('10', $response->headers->getCacheControlDirective('s-maxage'));
        self::assertFalse($response->headers->has('X-Reverse-Proxy-TTL'));
        self::assertNull($response->headers->getCacheControlDirective('max-age'));
    }

    public function testSubRequestsAreIgnored(): void
    {
        $state = new EmbedRenderState();
        $state->markDegraded();
        $response = $this->response();

        $this->fire($state, $response, HttpKernelInterface::SUB_REQUEST);

        self::assertSame('86400', $response->headers->getCacheControlDirective('s-maxage'));
        self::assertTrue($state->isDegraded());
    }

    public function testResolverMarksFailedAndSourcelessEmbedsAsDegraded(): void
    {
        $client = $this->createStub(VideoOptimizerClient::class);
        $client->method('getEmbed')->willReturnCallback(static function (string $uuid): array {
            if ('down' === $uuid) {
                throw new VideoOptimizerException('boom', 502);
            }

            return 'ok' === $uuid
                ? ['sources' => [['src' => 'https://cdn.example.net/m.m3u8', 'type' => VideoOptimizerEmbedResolver::HLS_MIME]]]
                : ['sources' => []];
        });
        $cache = new ArrayAdapter();

        foreach ([['ok', false], ['down', true], ['empty', true]] as [$uuid, $degraded]) {
            $state = new EmbedRenderState();
            (new VideoOptimizerEmbedResolver($client, $cache, $state))->getSources($uuid);
            self::assertSame($degraded, $state->isDegraded(), $uuid);
        }

        // A cached negative result degrades the page too.
        $state = new EmbedRenderState();
        (new VideoOptimizerEmbedResolver($client, $cache, $state))->getSources('down');
        self::assertTrue($state->isDegraded());
    }
}
