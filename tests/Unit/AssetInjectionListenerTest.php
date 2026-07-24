<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Scale\VideoOptimizerBundle\EventListener\AssetInjectionListener;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\HttpKernelInterface;
use Twig\Environment;
use Twig\Loader\ArrayLoader;

class AssetInjectionListenerTest extends TestCase
{
    private const CSS = '<link rel="stylesheet" href="/bundles/scalevideooptimizer/css/vo-blocks.css">';
    private const JS = '<script src="/bundles/scalevideooptimizer/js/vo-blocks.js" defer></script>';

    private function page(string $body): string
    {
        return "<!doctype html><html><head><title>t</title></head><body>{$body}</body></html>";
    }

    public function testInjectsCssBeforeHeadAndJsBeforeBodyAndRemovesSentinel(): void
    {
        $html = $this->page('<div class="vo-frame">' . AssetInjectionListener::SENTINEL . '</div>');

        $result = AssetInjectionListener::inject($html, self::CSS, self::JS);

        self::assertNotNull($result);
        self::assertStringContainsString(self::CSS . '</head>', $result);
        self::assertStringContainsString(self::JS . '</body>', $result);
        self::assertStringNotContainsString(AssetInjectionListener::SENTINEL, $result);
    }

    public function testReturnsNullWhenNoSentinelPresent(): void
    {
        $html = $this->page('<p>no video here</p>');

        self::assertNull(AssetInjectionListener::inject($html, self::CSS, self::JS));
    }

    public function testDoesNotDoubleInjectWhenAssetsAlreadyPresentButStripsSentinel(): void
    {
        $html = "<!doctype html><html><head>" . self::CSS . "</head><body>"
            . AssetInjectionListener::SENTINEL . self::JS . "</body></html>";

        $result = AssetInjectionListener::inject($html, self::CSS, self::JS);

        self::assertNotNull($result);
        self::assertStringNotContainsString(AssetInjectionListener::SENTINEL, $result);
        // Only the one pre-existing script tag, not a second injected one.
        self::assertSame(1, substr_count($result, 'vo-blocks.js'));
    }

    public function testRemovesEverySentinelOccurrence(): void
    {
        $html = $this->page(
            '<div>' . AssetInjectionListener::SENTINEL . '</div><div>' . AssetInjectionListener::SENTINEL . '</div>'
        );

        $result = AssetInjectionListener::inject($html, self::CSS, self::JS);

        self::assertNotNull($result);
        self::assertStringNotContainsString(AssetInjectionListener::SENTINEL, $result);
        self::assertSame(1, substr_count((string) $result, 'vo-blocks.css'));
        self::assertSame(1, substr_count((string) $result, 'vo-blocks.js'));
    }

    public function testReturnsNullWhenNoHeadOrBody(): void
    {
        $fragment = '<div class="vo-frame">' . AssetInjectionListener::SENTINEL . '</div>';

        self::assertNull(AssetInjectionListener::inject($fragment, self::CSS, self::JS));
    }

    private function listener(bool $enabled): AssetInjectionListener
    {
        $twig = new Environment(new ArrayLoader([
            '@ScaleVideoOptimizer/partials/_assets_css.html.twig' => self::CSS,
            '@ScaleVideoOptimizer/partials/_assets_js.html.twig' => self::JS,
        ]));

        return new AssetInjectionListener($twig, $enabled);
    }

    private function dispatch(AssetInjectionListener $listener, Response $response, int $requestType = HttpKernelInterface::MAIN_REQUEST): Response
    {
        $kernel = $this->createStub(HttpKernelInterface::class);
        $event = new ResponseEvent($kernel, new Request(), $requestType, $response);
        $listener->onKernelResponse($event);

        return $event->getResponse();
    }

    public function testKernelResponseInjectsAssetsIntoHtmlWithSentinel(): void
    {
        $response = new Response($this->page('<div>' . AssetInjectionListener::SENTINEL . '</div>'));

        $result = $this->dispatch($this->listener(true), $response)->getContent();

        self::assertStringContainsString(self::CSS . '</head>', (string) $result);
        self::assertStringContainsString(self::JS . '</body>', (string) $result);
        self::assertStringNotContainsString(AssetInjectionListener::SENTINEL, (string) $result);
    }

    public function testKernelResponseIsNoOpWhenDisabled(): void
    {
        $body = $this->page('<div>' . AssetInjectionListener::SENTINEL . '</div>');
        $response = new Response($body);

        $result = $this->dispatch($this->listener(false), $response)->getContent();

        self::assertSame($body, $result);
    }

    public function testKernelResponseIsNoOpForNonHtmlResponse(): void
    {
        $json = '{"vo":"' . AssetInjectionListener::SENTINEL . '"}';
        $response = new Response($json, 200, ['Content-Type' => 'application/json']);

        $result = $this->dispatch($this->listener(true), $response)->getContent();

        self::assertSame($json, $result);
    }

    public function testKernelResponseIsNoOpForSubRequest(): void
    {
        $body = $this->page('<div>' . AssetInjectionListener::SENTINEL . '</div>');
        $response = new Response($body);

        $result = $this->dispatch($this->listener(true), $response, HttpKernelInterface::SUB_REQUEST)->getContent();

        self::assertSame($body, $result);
    }
}
