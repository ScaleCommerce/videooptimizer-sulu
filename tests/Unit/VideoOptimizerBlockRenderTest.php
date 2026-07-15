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

    public function testDirectNativePlayerRendersVideoTagInsteadOfIframe(): void
    {
        $resolver = $this->resolver();
        $resolver->getDimensions('abc')->willReturn(['width' => 1920, 'height' => 1080, 'orientation' => 'landscape']);
        $resolver->getPosterSrcset('abc')->willReturn(null);
        $resolver->getSources('abc')->willReturn($this->sources());
        $resolver->getPlayable('abc')->willReturn($this->playable());

        $html = $this->render($resolver, 'vo_media_split.html.twig', [
            'block' => [
                'video' => ['uuid' => 'abc', 'posterUrl' => 'https://cdn.example.net/poster.jpg'],
                'headline' => 'Hero',
                'presentation' => 'direct',
                'player' => 'native',
            ],
        ]);

        self::assertStringContainsString('<video', $html);
        self::assertStringContainsString('data-hls="https://cdn.example.net/video.m3u8"', $html);
        self::assertStringContainsString('data-vo-player="native"', $html);
        self::assertStringNotContainsString('<iframe', $html);
        self::assertStringNotContainsString('data-vo-autoload', $html); // native is rendered directly, not JS-injected
        // Non-priority 'direct' native must not eagerly fetch/autoplay: deferred until scrolled
        // into view (vo-blocks.js initNativeAutoload), marked so it can find it.
        self::assertStringContainsString('preload="none"', $html);
        self::assertStringNotContainsString('autoplay', $html);
        self::assertStringContainsString('data-vo-native-autoload', $html);
    }

    public function testPriorityDirectNativePlayerRendersEagerly(): void
    {
        $resolver = $this->resolver();
        $resolver->getDimensions('abc')->willReturn(['width' => 1920, 'height' => 1080, 'orientation' => 'landscape']);
        $resolver->getPosterSrcset('abc')->willReturn(null);
        $resolver->getSources('abc')->willReturn($this->sources());
        $resolver->getPlayable('abc')->willReturn($this->playable());

        $html = $this->render($resolver, 'vo_media_split.html.twig', [
            'block' => [
                'video' => ['uuid' => 'abc', 'posterUrl' => 'https://cdn.example.net/poster.jpg'],
                'headline' => 'Hero',
                'presentation' => 'direct',
                'player' => 'native',
                'priority' => true,
            ],
        ]);

        // Above-the-fold direct+native block loads eagerly and may autoplay (default player
        // options autoplay to on for click-to-play/direct surfaces).
        self::assertStringContainsString('<video', $html);
        self::assertStringContainsString('preload="auto"', $html);
        self::assertStringContainsString('autoplay muted', $html);
        self::assertStringNotContainsString('data-vo-native-autoload', $html);
    }

    public function testDirectHostedPlayerStillRendersIframe(): void
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
                'player' => 'hosted',
            ],
        ]);

        self::assertStringContainsString('<iframe', $html);
        self::assertStringNotContainsString('<video', $html);
        self::assertStringContainsString('data-vo-player="hosted"', $html);
    }

    public function testFacadeNativePlayerRendersHiddenVideoAlongsidePoster(): void
    {
        $resolver = $this->resolver();
        $resolver->getDimensions('abc')->willReturn(['width' => 1920, 'height' => 1080, 'orientation' => 'landscape']);
        $resolver->getPosterSrcset('abc')->willReturn(null);
        $resolver->getSources('abc')->willReturn($this->sources());
        $resolver->getPlayable('abc')->willReturn($this->playable());

        $html = $this->render($resolver, 'vo_media_split.html.twig', [
            'block' => [
                'video' => ['uuid' => 'abc', 'posterUrl' => 'https://cdn.example.net/poster.jpg'],
                'headline' => 'Hero',
                'presentation' => 'facade',
                'player' => 'native',
            ],
        ]);

        // The poster/play button is still the click target (with the player choice on it)...
        self::assertStringContainsString('class="vo-facade" data-vo-player="native"', $html);
        self::assertStringContainsString('data-vo-embed=', $html);
        // ...and the native <video> is pre-rendered but hidden until vo-blocks.js reveals it.
        self::assertStringContainsString('<div class="vo-native-holder" hidden>', $html);
        self::assertStringContainsString('<video', $html);
        self::assertStringNotContainsString('<iframe', $html);
        // Hidden native must not eagerly fetch/autoplay while off-screen behind display:none.
        // (Checked against the exact attribute renderNative() emits when eager — the facade's
        // click-to-play fallback URL legitimately contains "autoplay=1" as a query param.)
        self::assertStringContainsString('preload="none"', $html);
        self::assertStringNotContainsString(' autoplay muted', $html);
    }

    public function testLightboxNativePlayerRendersHiddenVideoAlongsidePoster(): void
    {
        $resolver = $this->resolver();
        $resolver->getDimensions('abc')->willReturn(['width' => 1080, 'height' => 1920, 'orientation' => 'portrait']);
        $resolver->getPosterSrcset('abc')->willReturn(null);
        $resolver->getSources('abc')->willReturn($this->sources());
        $resolver->getPlayable('abc')->willReturn($this->playable());

        $html = $this->render($resolver, 'vo_spotlight.html.twig', [
            'block' => [
                'video' => ['uuid' => 'abc', 'posterUrl' => 'https://cdn.example.net/poster.jpg'],
                'headline' => 'Watch',
                'player' => 'native',
            ],
        ]);

        self::assertStringContainsString('data-vo-lightbox=', $html);
        self::assertStringContainsString('data-vo-player="native"', $html);
        self::assertStringContainsString('<div class="vo-native-holder" hidden>', $html);
        self::assertStringContainsString('<video', $html);
        self::assertStringNotContainsString('<iframe', $html);
        // Hidden native must not eagerly fetch/autoplay while off-screen behind display:none.
        // (Checked against the exact attribute renderNative() emits when eager — the facade's
        // click-to-play fallback URL legitimately contains "autoplay=1" as a query param.)
        self::assertStringContainsString('preload="none"', $html);
        self::assertStringNotContainsString(' autoplay muted', $html);
    }

    public function testVideoGridNativePlayerAppliesToAllItems(): void
    {
        $resolver = $this->resolver();
        $resolver->getDimensions('abc')->willReturn(['width' => 1920, 'height' => 1080, 'orientation' => 'landscape']);
        $resolver->getPosterSrcset('abc')->willReturn(null);
        $resolver->getSources('abc')->willReturn($this->sources());
        $resolver->getPlayable('abc')->willReturn($this->playable());

        $html = $this->render($resolver, 'vo_video_grid.html.twig', [
            'block' => [
                'headline' => 'Clips',
                'player' => 'native',
                'items' => [
                    ['video' => ['uuid' => 'abc', 'posterUrl' => 'https://cdn.example.net/poster.jpg'], 'label' => 'One'],
                ],
            ],
        ]);

        self::assertStringContainsString('<div class="vo-native-holder" hidden>', $html);
        self::assertStringContainsString('<video', $html);
        self::assertStringNotContainsString('<iframe', $html);
    }

    public function testRenderNativeBuildsVideoTagWithMp4SourceAndHlsAttribute(): void
    {
        $resolver = $this->resolver();
        $resolver->getPlayable('abc')->willReturn([
            'poster' => 'https://cdn.example.net/poster.jpg',
            'sources' => [
                ['src' => 'https://cdn.example.net/video.m3u8', 'type' => 'application/vnd.apple.mpegurl', 'label' => 'HLS'],
                ['src' => 'https://cdn.example.net/video.mp4', 'type' => 'video/mp4', 'label' => 'MP4'],
            ],
            'theme' => ['accentColor' => '#ff0033'],
            'width' => 1920,
            'height' => 1080,
        ]);

        $extension = new VideoOptimizerExtension('https://videooptimizer.eu', $resolver->reveal());
        // eager=true: the above-the-fold 'direct' + priority case, which keeps autoplay+muted.
        $html = $extension->renderNative(['uuid' => 'abc'], ['autoplay' => '1', 'loop' => '1'], true);

        self::assertStringContainsString('<video', $html);
        self::assertStringContainsString('src="https://cdn.example.net/video.mp4"', $html);
        self::assertStringContainsString('type="video/mp4"', $html);
        self::assertStringContainsString('data-hls="https://cdn.example.net/video.m3u8"', $html);
        self::assertStringContainsString('poster="https://cdn.example.net/poster.jpg"', $html);
        self::assertStringContainsString('preload="auto"', $html);
        self::assertStringContainsString('autoplay muted', $html);
        self::assertStringContainsString('loop', $html);
        self::assertStringContainsString('style="--vo-player-accent:#ff0033"', $html);
        self::assertStringNotContainsString('src="https://cdn.example.net/video.m3u8"', $html); // HLS master is not a <source>, only data-hls
    }

    public function testRenderNativeIsDeferredByDefault(): void
    {
        $resolver = $this->resolver();
        $resolver->getPlayable('abc')->willReturn($this->playable());

        $extension = new VideoOptimizerExtension('https://videooptimizer.eu', $resolver->reveal());
        // eager defaults to false: must not fetch/play until something explicitly plays it.
        $html = $extension->renderNative(['uuid' => 'abc'], ['autoplay' => '1', 'loop' => '1']);

        self::assertStringContainsString('preload="none"', $html);
        self::assertStringNotContainsString('autoplay', $html);
        self::assertStringNotContainsString('muted', $html);
        self::assertStringContainsString('loop', $html); // loop is allowed regardless of eager
    }

    public function testRenderNativeReturnsEmptyStringWithoutVideo(): void
    {
        $resolver = $this->resolver();
        $extension = new VideoOptimizerExtension('https://videooptimizer.eu', $resolver->reveal());

        self::assertSame('', $extension->renderNative(null));
        self::assertSame('', $extension->renderNative([]));
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

    /**
     * @return array{poster: ?string, sources: array<int, array{src: string, type: string, label: string}>, theme: array<string, mixed>, width: ?int, height: ?int}
     */
    private function playable(): array
    {
        return [
            'poster' => 'https://cdn.example.net/poster.jpg',
            'sources' => [
                ['src' => 'https://cdn.example.net/video.m3u8', 'type' => 'application/vnd.apple.mpegurl', 'label' => 'HLS'],
                ['src' => 'https://cdn.example.net/video.mp4', 'type' => 'video/mp4', 'label' => 'MP4'],
            ],
            'theme' => [],
            'width' => 1920,
            'height' => 1080,
        ];
    }
}
