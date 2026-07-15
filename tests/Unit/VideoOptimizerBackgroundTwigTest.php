<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Prophecy\PhpUnit\ProphecyTrait;
use Scale\VideoOptimizerBundle\Service\SettingsManager;
use Scale\VideoOptimizerBundle\Service\VideoOptimizerEmbedResolver;
use Scale\VideoOptimizerBundle\Twig\VideoOptimizerExtension;

class VideoOptimizerBackgroundTwigTest extends TestCase
{
    use ProphecyTrait;

    public function testRendersVideoTagWithHlsAndPoster(): void
    {
        $resolver = $this->prophesize(VideoOptimizerEmbedResolver::class);
        $resolver->getSources('abc')->willReturn([
            'poster' => 'https://cdn.example.net/poster.jpg',
            'hlsUrl' => 'https://cdn.example.net/master.m3u8',
        ]);

        $ext = new VideoOptimizerExtension('https://videooptimizer.eu', $resolver->reveal(), $this->settingsManager()->reveal());

        $html = $ext->renderBackground(['uuid' => 'abc', 'posterUrl' => 'https://stored/poster.jpg']);

        self::assertStringContainsString('<video', $html);
        self::assertStringContainsString('data-hls="https://cdn.example.net/master.m3u8"', $html);
        self::assertStringContainsString('poster="https://cdn.example.net/poster.jpg"', $html);
        self::assertStringContainsString('muted', $html);
        self::assertStringContainsString('loop', $html);
        self::assertStringContainsString('playsinline', $html);
    }

    public function testFallsBackToStoredPosterWhenResolverHasNone(): void
    {
        $resolver = $this->prophesize(VideoOptimizerEmbedResolver::class);
        $resolver->getSources('abc')->willReturn(['poster' => null, 'hlsUrl' => null]);

        $ext = new VideoOptimizerExtension('https://videooptimizer.eu', $resolver->reveal(), $this->settingsManager()->reveal());

        $html = $ext->renderBackground(['uuid' => 'abc', 'posterUrl' => 'https://stored/poster.jpg']);

        self::assertStringContainsString('poster="https://stored/poster.jpg"', $html);
    }

    public function testReturnsEmptyStringWithoutUuid(): void
    {
        $resolver = $this->prophesize(VideoOptimizerEmbedResolver::class);
        $ext = new VideoOptimizerExtension('https://videooptimizer.eu', $resolver->reveal(), $this->settingsManager()->reveal());

        self::assertSame('', $ext->renderBackground(null));
        self::assertSame('', $ext->renderBackground(['title' => 'x']));
    }

    public function testEmbedUrlWithoutOptionsHasNoQuery(): void
    {
        $ext = $this->extension();

        self::assertSame('https://videooptimizer.eu/embed/abc', $ext->embedUrl(['uuid' => 'abc']));
    }

    public function testEmbedUrlAppendsOnlyExplicitBooleanParams(): void
    {
        $ext = $this->extension();

        $url = $ext->embedUrl(['uuid' => 'abc'], [
            'autoplay' => '1',
            'controls' => '0',
            'loop' => 'inherit', // sentinel -> omitted
            'muted' => '',        // omitted
        ]);

        self::assertSame('https://videooptimizer.eu/embed/abc?autoplay=1&controls=0', $url);
    }

    public function testEmbedUrlIgnoresUnknownAndNonBooleanValues(): void
    {
        $ext = $this->extension();

        $url = $ext->embedUrl(['uuid' => 'abc'], ['fit' => 'cover', 'autoplay' => 'yes', 'controls' => '1']);

        // 'fit' is not an allowlisted boolean param and 'yes' is not 0/1 -> only controls=1 survives.
        self::assertSame('https://videooptimizer.eu/embed/abc?controls=1', $url);
    }

    public function testEmbedUrlReturnsNullWithoutUuid(): void
    {
        self::assertNull($this->extension()->embedUrl(null, ['autoplay' => '1']));
    }

    private function extension(): VideoOptimizerExtension
    {
        $resolver = $this->prophesize(VideoOptimizerEmbedResolver::class);

        return new VideoOptimizerExtension('https://videooptimizer.eu', $resolver->reveal(), $this->settingsManager()->reveal());
    }

    /**
     * @return \Prophecy\Prophecy\ObjectProphecy<SettingsManager>
     */
    private function settingsManager(string $defaultPlayer = 'hosted'): \Prophecy\Prophecy\ObjectProphecy
    {
        $settingsManager = $this->prophesize(SettingsManager::class);
        $settingsManager->getDefaultPlayer()->willReturn($defaultPlayer);

        return $settingsManager;
    }

    public function testSchemaRendersVideoObjectJsonLd(): void
    {
        $resolver = $this->prophesize(VideoOptimizerEmbedResolver::class);
        $resolver->getSources('abc')->willReturn([
            'poster' => 'https://cdn.example.net/poster.jpg',
            'hlsUrl' => null,
            'width' => null,
            'height' => null,
            'duration' => 90,
        ]);
        $ext = new VideoOptimizerExtension('https://videooptimizer.eu', $resolver->reveal(), $this->settingsManager()->reveal());

        $html = $ext->schema(['uuid' => 'abc', 'title' => 'Stored title'], 'My headline');

        self::assertStringStartsWith('<script type="application/ld+json">', $html);
        self::assertStringContainsString('"@type":"VideoObject"', $html);
        self::assertStringContainsString('"name":"My headline"', $html);
        self::assertStringContainsString('"thumbnailUrl":"https://cdn.example.net/poster.jpg"', $html);
        self::assertStringContainsString('"embedUrl":"https://videooptimizer.eu/embed/abc"', $html);
        self::assertStringContainsString('"duration":"PT1M30S"', $html);
    }

    public function testSchemaEscapesClosingScriptTagInName(): void
    {
        $resolver = $this->prophesize(VideoOptimizerEmbedResolver::class);
        $resolver->getSources('abc')->willReturn(['poster' => null, 'hlsUrl' => null, 'width' => null, 'height' => null, 'duration' => null]);
        $ext = new VideoOptimizerExtension('https://videooptimizer.eu', $resolver->reveal(), $this->settingsManager()->reveal());

        $html = $ext->schema(['uuid' => 'abc'], '</script><script>alert(1)</script>');

        // The only literal </script> allowed is the closing tag we emit; the name must be hex-escaped.
        self::assertSame(1, substr_count($html, '</script>'));
        self::assertStringNotContainsString('<script>alert(1)', $html);
    }

    public function testSchemaReturnsEmptyWithoutVideo(): void
    {
        self::assertSame('', $this->extension()->schema(null));
        self::assertSame('', $this->extension()->schema(['title' => 'x']));
    }

    public function testPlayerOptionsDefaultsAutoplayOnWhenInherited(): void
    {
        // No fields set -> click-to-play surfaces default autoplay on, controls/loop/muted inherit the theme.
        self::assertSame(
            ['autoplay' => '1', 'controls' => 'inherit', 'loop' => 'inherit', 'muted' => 'inherit'],
            $this->extension()->playerOptions([]),
        );
    }

    public function testPlayerOptionsHonorsExplicitValues(): void
    {
        self::assertSame(
            ['autoplay' => '0', 'controls' => '1', 'loop' => '0', 'muted' => '1'],
            $this->extension()->playerOptions(['autoplay' => '0', 'controls' => '1', 'loop' => '0', 'muted' => '1']),
        );
    }

    public function testPlayerFallsBackToGlobalDefaultWhenInherited(): void
    {
        $resolver = $this->prophesize(VideoOptimizerEmbedResolver::class);
        $ext = new VideoOptimizerExtension('https://videooptimizer.eu', $resolver->reveal(), $this->settingsManager('native')->reveal());

        self::assertSame('native', $ext->player(['player' => 'inherit']));
        self::assertSame('native', $ext->player([]));
        self::assertSame('native', $ext->player(null));
    }

    public function testPlayerHonorsExplicitBlockChoiceRegardlessOfDefault(): void
    {
        $resolver = $this->prophesize(VideoOptimizerEmbedResolver::class);
        $ext = new VideoOptimizerExtension('https://videooptimizer.eu', $resolver->reveal(), $this->settingsManager('native')->reveal());

        self::assertSame('hosted', $ext->player(['player' => 'hosted']));
    }
}
