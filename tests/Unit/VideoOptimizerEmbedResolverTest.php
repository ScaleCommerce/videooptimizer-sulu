<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Prophecy\PhpUnit\ProphecyTrait;
use Scale\VideoOptimizerBundle\Api\VideoOptimizerClient;
use Scale\VideoOptimizerBundle\Service\VideoOptimizerEmbedResolver;
use Symfony\Component\Cache\Adapter\ArrayAdapter;

class VideoOptimizerEmbedResolverTest extends TestCase
{
    use ProphecyTrait;

    public function testExtractsPosterAndHlsSource(): void
    {
        $data = [
            'poster' => 'https://cdn.example.net/thumbnails/uuid/thumb_00.jpg',
            'sources' => [
                ['src' => 'https://cdn.example.net/encoded/uuid/hls/master.m3u8', 'type' => 'application/vnd.apple.mpegurl'],
                ['src' => 'https://cdn.example.net/encoded/uuid/h264/480p.mp4', 'type' => 'video/mp4'],
            ],
        ];

        $result = VideoOptimizerEmbedResolver::extractSources($data);

        self::assertSame('https://cdn.example.net/thumbnails/uuid/thumb_00.jpg', $result['poster']);
        self::assertSame('https://cdn.example.net/encoded/uuid/hls/master.m3u8', $result['hlsUrl']);
    }

    public function testReturnsNullsWhenNoHlsSourcePresent(): void
    {
        $result = VideoOptimizerEmbedResolver::extractSources(['poster' => null, 'sources' => []]);

        self::assertNull($result['poster']);
        self::assertNull($result['hlsUrl']);
    }

    public function testIgnoresMalformedSourceEntries(): void
    {
        $data = ['sources' => [['type' => 'application/vnd.apple.mpegurl'], 'not-an-array', ['src' => '', 'type' => 'application/vnd.apple.mpegurl']]];

        $result = VideoOptimizerEmbedResolver::extractSources($data);

        self::assertNull($result['hlsUrl']);
    }

    public function testDoesNotCacheFailedLookups(): void
    {
        $client = $this->prophesize(VideoOptimizerClient::class);
        $client->getEmbed('abc')->willThrow(new \RuntimeException('API unreachable'));

        $resolver = new VideoOptimizerEmbedResolver($client->reveal(), new ArrayAdapter());

        self::assertSame(
            ['poster' => null, 'hlsUrl' => null, 'width' => null, 'height' => null, 'duration' => null, 'srcset' => null],
            $resolver->getSources('abc'),
            'A failed lookup must return the null fallback.',
        );

        // The failure must not be memorized: a later successful call has to hit the API again.
        $client->getEmbed('abc')->willReturn([
            'poster' => 'https://cdn.example.net/thumbnails/abc/thumb_00.jpg',
            'resolution' => '1920x1080',
            'duration' => '42',
            'sources' => [
                ['src' => 'https://cdn.example.net/encoded/abc/hls/master.m3u8', 'type' => 'application/vnd.apple.mpegurl'],
            ],
        ]);

        self::assertSame(
            [
                'poster' => 'https://cdn.example.net/thumbnails/abc/thumb_00.jpg',
                'hlsUrl' => 'https://cdn.example.net/encoded/abc/hls/master.m3u8',
                'width' => 1920,
                'height' => 1080,
                'duration' => 42,
                'srcset' => null,
            ],
            $resolver->getSources('abc'),
            'After a failure the resolver must retry and return the real sources.',
        );
    }

    public function testParsesPosterSrcsetFromDescriptorStrings(): void
    {
        $srcset = VideoOptimizerEmbedResolver::parsePosterSrcset([
            'https://cdn.example.net/p-320.jpg 320w',
            'https://cdn.example.net/p-640.jpg 640w',
        ]);

        self::assertSame('https://cdn.example.net/p-320.jpg 320w, https://cdn.example.net/p-640.jpg 640w', $srcset);
    }

    public function testParsesPosterSrcsetFromApiWidthHeightUrlEntries(): void
    {
        // Real API shape: [{width, height, url}, ...]
        $srcset = VideoOptimizerEmbedResolver::parsePosterSrcset([
            ['width' => 640, 'height' => 360, 'url' => 'https://cdn.example.net/thumb_00.jpg'],
            ['width' => 1280, 'height' => 720, 'url' => 'https://cdn.example.net/thumb_00_1280.jpg'],
            ['width' => 1920, 'height' => 1080, 'url' => 'https://cdn.example.net/thumb_00_1920.jpg'],
        ]);

        self::assertSame(
            'https://cdn.example.net/thumb_00.jpg 640w, https://cdn.example.net/thumb_00_1280.jpg 1280w, https://cdn.example.net/thumb_00_1920.jpg 1920w',
            $srcset,
        );
    }

    public function testParsesPosterSrcsetFallsBackToLegacySrcKey(): void
    {
        $srcset = VideoOptimizerEmbedResolver::parsePosterSrcset([
            ['src' => 'https://cdn.example.net/p-320.jpg', 'width' => '320'],
        ]);

        self::assertSame('https://cdn.example.net/p-320.jpg 320w', $srcset);
    }

    public function testPosterSrcsetIsNullWhenEmptyOrUnusable(): void
    {
        self::assertNull(VideoOptimizerEmbedResolver::parsePosterSrcset(null));
        self::assertNull(VideoOptimizerEmbedResolver::parsePosterSrcset([]));
        // No width descriptor / no width key -> not a valid srcset entry, so skipped.
        self::assertNull(VideoOptimizerEmbedResolver::parsePosterSrcset(['https://cdn.example.net/plain.jpg']));
        self::assertNull(VideoOptimizerEmbedResolver::parsePosterSrcset([['src' => 'https://cdn.example.net/x.jpg']]));
    }

    public function testParsesDurationSeconds(): void
    {
        self::assertSame(6, VideoOptimizerEmbedResolver::extractSources(['duration' => '6'])['duration']);
        self::assertSame(6, VideoOptimizerEmbedResolver::extractSources(['duration' => 6])['duration']);
        self::assertNull(VideoOptimizerEmbedResolver::extractSources(['duration' => 'abc'])['duration']);
        self::assertNull(VideoOptimizerEmbedResolver::extractSources([])['duration']);
    }

    public function testIsoDurationFormatsSeconds(): void
    {
        self::assertSame('PT6S', VideoOptimizerEmbedResolver::isoDuration(6));
        self::assertSame('PT1M30S', VideoOptimizerEmbedResolver::isoDuration(90));
        self::assertSame('PT1H', VideoOptimizerEmbedResolver::isoDuration(3600));
        self::assertSame('PT1H1M1S', VideoOptimizerEmbedResolver::isoDuration(3661));
        self::assertNull(VideoOptimizerEmbedResolver::isoDuration(0));
        self::assertNull(VideoOptimizerEmbedResolver::isoDuration(null));
    }

    public function testExtractsDimensionsFromResolution(): void
    {
        $result = VideoOptimizerEmbedResolver::extractSources(['resolution' => '1260x710']);

        self::assertSame(1260, $result['width']);
        self::assertSame(710, $result['height']);
    }

    public function testDimensionsAreNullWhenResolutionMissingOrMalformed(): void
    {
        self::assertSame([null, null], VideoOptimizerEmbedResolver::parseResolution(null));
        self::assertSame([null, null], VideoOptimizerEmbedResolver::parseResolution('not-a-resolution'));
        self::assertSame([1080, 1920], VideoOptimizerEmbedResolver::parseResolution('1080x1920'));
    }

    public function testOrientationForClassifiesByDimensions(): void
    {
        self::assertSame('landscape', VideoOptimizerEmbedResolver::orientationFor(1920, 1080));
        self::assertSame('portrait', VideoOptimizerEmbedResolver::orientationFor(1080, 1920));
        self::assertSame('square', VideoOptimizerEmbedResolver::orientationFor(500, 500));
        self::assertNull(VideoOptimizerEmbedResolver::orientationFor(null, 720));
        self::assertNull(VideoOptimizerEmbedResolver::orientationFor(0, 0));
    }

    public function testGetDimensionsResolvesOrientationFromEmbed(): void
    {
        $client = $this->prophesize(VideoOptimizerClient::class);
        $client->getEmbed('vert')->willReturn(['resolution' => '1080x1920']);

        $resolver = new VideoOptimizerEmbedResolver($client->reveal(), new ArrayAdapter());

        self::assertSame(
            ['width' => 1080, 'height' => 1920, 'orientation' => 'portrait'],
            $resolver->getDimensions('vert'),
        );
    }
}
