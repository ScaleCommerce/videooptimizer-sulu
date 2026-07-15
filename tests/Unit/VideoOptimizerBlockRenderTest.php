<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Prophecy\PhpUnit\ProphecyTrait;
use Prophecy\Prophecy\ObjectProphecy;
use Scale\VideoOptimizerBundle\Service\VideoOptimizerEmbedResolver;
use Scale\VideoOptimizerBundle\Twig\VideoOptimizerExtension;
use Twig\Environment;
use Twig\Loader\FilesystemLoader;

/**
 * Renders the block Twig templates through a real Twig environment (with a stubbed resolver) so the
 * shipped markup — poster <img>, srcset/sizes, facade, orientation class, JSON-LD — is asserted, not
 * just lint-checked.
 */
class VideoOptimizerBlockRenderTest extends TestCase
{
    use ProphecyTrait;

    public function testMediaSplitRendersLazyResponsivePosterFacade(): void
    {
        $resolver = $this->resolver();
        $resolver->getDimensions('abc')->willReturn(['width' => 1920, 'height' => 1080, 'orientation' => 'landscape']);
        $resolver->getPosterSrcset('abc')->willReturn('https://cdn.example.net/p-320.jpg 320w, https://cdn.example.net/p-640.jpg 640w');
        $resolver->getSources('abc')->willReturn($this->sources());

        $html = $this->render($resolver, 'vo_media_split.html.twig', [
            'block' => [
                'video' => ['uuid' => 'abc', 'posterUrl' => 'https://cdn.example.net/poster.jpg', 'title' => 'Clip'],
                'headline' => 'Hello',
                'side' => 'left',
            ],
        ]);

        self::assertStringContainsString('class="vo-facade"', $html);
        self::assertStringContainsString('data-vo-embed="https://videooptimizer.eu/embed/abc?autoplay=1"', $html);
        self::assertStringContainsString('<img class="vo-poster__img" src="https://cdn.example.net/poster.jpg"', $html);
        self::assertStringContainsString('srcset="https://cdn.example.net/p-320.jpg 320w, https://cdn.example.net/p-640.jpg 640w"', $html);
        self::assertStringContainsString('sizes="(min-width: 820px) 45vw, 100vw"', $html);
        self::assertStringContainsString('width="1920" height="1080"', $html);
        self::assertStringContainsString('alt=""', $html);
        self::assertStringContainsString('loading="lazy"', $html);
        self::assertStringNotContainsString('fetchpriority', $html);
        self::assertStringContainsString('vo-reveal', $html); // non-priority block fades in
        self::assertStringContainsString('aspect-ratio: 1920 / 1080', $html);
        self::assertStringContainsString('<script type="application/ld+json">', $html);
    }

    public function testPriorityBlockLoadsPosterEagerlyAndSkipsReveal(): void
    {
        $resolver = $this->resolver();
        $resolver->getDimensions('abc')->willReturn(['width' => 1920, 'height' => 1080, 'orientation' => 'landscape']);
        $resolver->getPosterSrcset('abc')->willReturn(null);
        $resolver->getSources('abc')->willReturn($this->sources());

        $html = $this->render($resolver, 'vo_media_split.html.twig', [
            'block' => [
                'video' => ['uuid' => 'abc', 'posterUrl' => 'https://cdn.example.net/poster.jpg'],
                'headline' => 'Hero',
                'priority' => true,
            ],
        ]);

        self::assertStringContainsString('loading="eager"', $html);
        self::assertStringContainsString('fetchpriority="high"', $html);
        self::assertStringNotContainsString('vo-reveal', $html); // above-the-fold block must not fade in
    }

    public function testPriorityDirectEmbedsEagerlyWithoutAutoload(): void
    {
        $resolver = $this->resolver();
        $resolver->getDimensions('abc')->willReturn(['width' => 1920, 'height' => 1080, 'orientation' => 'landscape']);
        $resolver->getPosterSrcset('abc')->willReturn(null);
        $resolver->getSources('abc')->willReturn($this->sources());

        $html = $this->render($resolver, 'vo_media_split.html.twig', [
            'block' => [
                'video' => ['uuid' => 'abc', 'posterUrl' => 'https://cdn.example.net/poster.jpg'],
                'headline' => 'Hero',
                'presentation' => 'direct',
                'priority' => true,
            ],
        ]);

        // Above-the-fold direct block embeds immediately (no scroll-into-view defer) and eagerly.
        self::assertStringContainsString('<iframe', $html);
        self::assertStringContainsString('src="https://videooptimizer.eu/embed/abc?autoplay=1"', $html);
        self::assertStringContainsString('loading="eager"', $html);
        self::assertStringNotContainsString('loading="lazy"', $html);
        self::assertStringNotContainsString('data-vo-autoload', $html);
        self::assertStringNotContainsString('<noscript>', $html);
    }

    public function testSpotlightPortraitOmitsSrcsetWhenNone(): void
    {
        $resolver = $this->resolver();
        $resolver->getDimensions('abc')->willReturn(['width' => 1080, 'height' => 1920, 'orientation' => 'portrait']);
        $resolver->getPosterSrcset('abc')->willReturn(null);
        $resolver->getSources('abc')->willReturn($this->sources());

        $html = $this->render($resolver, 'vo_spotlight.html.twig', [
            'block' => [
                'video' => ['uuid' => 'abc', 'posterUrl' => 'https://cdn.example.net/poster.jpg'],
                'headline' => 'Watch',
            ],
        ]);

        // Default presentation for spotlight is 'lightbox': poster button opens the overlay.
        self::assertStringContainsString('vo-frame--portrait', $html);
        self::assertStringContainsString('data-vo-lightbox="https://videooptimizer.eu/embed/abc?autoplay=1"', $html);
        self::assertStringContainsString('<img class="vo-poster__img"', $html);
        self::assertStringNotContainsString('srcset=', $html);
        self::assertStringNotContainsString('sizes=', $html);
    }

    public function testDirectPresentationDefersLoadUntilInView(): void
    {
        $resolver = $this->resolver();
        $resolver->getDimensions('abc')->willReturn(['width' => 1920, 'height' => 1080, 'orientation' => 'landscape']);
        $resolver->getPosterSrcset('abc')->willReturn(null);
        $resolver->getSources('abc')->willReturn($this->sources());

        $html = $this->render($resolver, 'vo_media_split.html.twig', [
            'block' => [
                'video' => ['uuid' => 'abc', 'posterUrl' => 'https://cdn.example.net/poster.jpg', 'title' => 'Clip'],
                'headline' => 'Hello',
                'presentation' => 'direct',
            ],
        ]);

        // The player is NOT embedded eagerly: JS injects it on scroll-into-view via data-vo-autoload.
        self::assertStringContainsString('data-vo-autoload="https://videooptimizer.eu/embed/abc?autoplay=1"', $html);
        self::assertStringContainsString('<img class="vo-poster__img"', $html); // placeholder poster (no layout shift)
        // No-JS fallback embeds the (native-lazy) player with autoplay permitted.
        self::assertStringContainsString('<noscript>', $html);
        self::assertStringContainsString('allow="autoplay;', $html);
        // No click affordance in direct mode.
        self::assertStringNotContainsString('vo-facade', $html);
        self::assertStringNotContainsString('data-vo-embed=', $html);
        self::assertStringNotContainsString('data-vo-lightbox', $html);
    }

    /**
     * @param array<string, mixed> $context
     */
    private function render(ObjectProphecy $resolver, string $template, array $context): string
    {
        // Mirror the bundle's Twig namespace so blocks can include '@ScaleVideoOptimizer/blocks/_video.html.twig'.
        $loader = new FilesystemLoader();
        $loader->addPath(\dirname(__DIR__, 2) . '/src/Resources/views', 'ScaleVideoOptimizer');

        $twig = new Environment($loader, ['autoescape' => 'html', 'strict_variables' => false]);
        $twig->addExtension(new VideoOptimizerExtension('https://videooptimizer.eu', $resolver->reveal()));

        return $twig->render('@ScaleVideoOptimizer/blocks/' . $template, $context);
    }

    private function resolver(): ObjectProphecy
    {
        return $this->prophesize(VideoOptimizerEmbedResolver::class);
    }

    /**
     * @return array{poster: ?string, hlsUrl: ?string, width: ?int, height: ?int, duration: ?int, srcset: ?string}
     */
    private function sources(): array
    {
        return ['poster' => 'https://cdn.example.net/poster.jpg', 'hlsUrl' => null, 'width' => 1920, 'height' => 1080, 'duration' => 12, 'srcset' => null];
    }
}
