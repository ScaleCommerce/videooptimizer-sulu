<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Tests\Unit;

use PHPUnit\Framework\TestCase;

/**
 * Source-level contract for `vo-blocks.js` — NOT a behaviour test.
 *
 * The bundle has no JS test runner, so this reads the shipped script (comments stripped) and pins
 * the decisions that fail silently when lost: which elements the background HLS wiring picks up,
 * the order of its checks, and the guards around deferring to `load`. Proving that a video plays
 * needs a browser.
 */
final class VoBlocksJsContractTest extends TestCase
{
    private const BUNDLE_SELECTOR = '.vo-bg-hero__video[data-hls]';
    private const OPT_IN_SELECTOR = 'video[data-vo-hls][data-hls]';

    private static function script(): string
    {
        $path = \dirname(__DIR__, 2) . '/src/Resources/public/js/vo-blocks.js';
        self::assertFileExists($path);
        $content = (string) \file_get_contents($path);
        self::assertGreaterThan(1000, \strlen($content), 'vo-blocks.js is suspiciously small.');

        // Comments may name forbidden forms to explain them; the contract applies to code only.
        $code = \preg_replace('#/\*.*?\*/#s', '', $content);

        return (string) \preg_replace('#^\s*//[^\n]*$#m', '', (string) $code);
    }

    /**
     * Cuts one top-level function out of the IIFE (four-space indentation).
     */
    private static function fn(string $name): string
    {
        $script = self::script();
        $start = \strpos($script, 'function ' . $name . '(');
        self::assertNotFalse($start, \sprintf('Function %s() not found.', $name));
        $end = \strpos($script, "\n    }", $start);
        self::assertNotFalse($end, \sprintf('End of %s() not found.', $name));

        return \substr($script, $start, $end - $start);
    }

    /**
     * A bare element selector `video[data-hls]` not preceded by a class/id/identifier character,
     * i.e. wiring every <video> instead of the bundle class or the opt-in marker.
     */
    private static function isWidened(string $code): bool
    {
        return 1 === \preg_match('/(?<![\w.#-])video\[data-hls\]/', $code);
    }

    public function testBackgroundWiringFindsBundleMarkupAndOptInMarkup(): void
    {
        $body = self::fn('initBackgroundVideos');

        self::assertStringContainsString(self::BUNDLE_SELECTOR, $body);
        self::assertStringContainsString(self::OPT_IN_SELECTOR, $body, 'Without the data-vo-hls opt-in, custom markup never plays.');
        self::assertFalse(self::isWidened($body), 'Selector widened to every video — would wire facade/lazy natives.');
    }

    public function testWidenedSelectorCriterionCanFail(): void
    {
        $body = self::fn('initBackgroundVideos');
        $widened = \str_replace(self::BUNDLE_SELECTOR . ', ' . self::OPT_IN_SELECTOR, 'video[data-hls]', $body);

        self::assertNotSame($body, $widened, 'Mutation had no effect — selector pair not in the expected form.');
        self::assertTrue(self::isWidened($widened));
    }

    public function testNativePathKeepsItsExclusions(): void
    {
        $body = self::fn('initNativePlayers');

        self::assertStringContainsString('.vo-native-holder', $body);
        self::assertStringContainsString('data-vo-native-autoload', $body);
    }

    public function testChecksRunInOrderReducedMotionDeferralRendered(): void
    {
        $body = self::fn('initBackgroundVideos');

        $motion = \strpos($body, 'prefersReducedMotion()');
        $eager = \strpos($body, "hasAttribute('data-vo-hls-eager')");
        $defer = \strpos($body, 'afterPageLoad(');
        $rendered = \strrpos($body, 'wireWhenRendered(');

        self::assertNotFalse($motion, 'Reduced-motion exit missing.');
        self::assertNotFalse($eager, 'Eager opt-out is no longer read from the attribute.');
        self::assertNotFalse($defer, 'Deferral missing — background videos compete with page content again.');
        self::assertNotFalse($rendered);
        self::assertLessThan($eager, $motion);
        // The attribute is the exception: checked before deferring, so its absence means "wait".
        self::assertLessThan($defer, $eager);
        // The rendered check runs after the wait.
        self::assertLessThan($rendered, $defer);
        self::assertStringNotContainsString('attachHls(', $body, 'HLS attached directly, bypassing the rendered check.');
    }

    public function testRenderedCheckIsNotAViewportTest(): void
    {
        $body = self::fn('isRendered');

        self::assertStringContainsString('getClientRects()', $body);
        foreach (['IntersectionObserver', 'getBoundingClientRect', 'innerHeight', 'scrollY'] as $forbidden) {
            self::assertStringNotContainsString($forbidden, $body);
        }
    }

    public function testHiddenVideoIsWiredOnceItBecomesRendered(): void
    {
        $body = self::fn('wireWhenRendered');

        self::assertStringContainsString('ResizeObserver', $body);
        self::assertStringContainsString('observer.disconnect()', $body);
        self::assertStringContainsString("typeof ResizeObserver !== 'function'", $body, 'No fallback for browsers without ResizeObserver.');
    }

    public function testDeferralHandlesLoadAlreadyFiredAndLoadNeverFiring(): void
    {
        $body = self::fn('afterPageLoad');

        self::assertStringContainsString("readyState === 'complete'", $body, 'A listener added after load never fires.');
        self::assertStringContainsString("addEventListener('load', resolve, {once: true})", $body);
        // The timeout must race `load`, not be started inside the load listener.
        self::assertStringContainsString('setTimeout(resolve, BACKGROUND_LOAD_TIMEOUT_MS)', $body);
        self::assertStringNotContainsString("addEventListener('load', function", $body);
    }

    public function testBootstrapRunsEvenWhenDomContentLoadedAlreadyFired(): void
    {
        $script = self::script();

        self::assertStringContainsString("document.readyState === 'loading'", $script);
        self::assertStringContainsString("addEventListener('DOMContentLoaded', init)", $script);
    }
}
