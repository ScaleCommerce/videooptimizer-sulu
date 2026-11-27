<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Prophecy\PhpUnit\ProphecyTrait;
use Scale\VideoOptimizerBundle\Api\VideoOptimizerClient;
use Scale\VideoOptimizerBundle\Api\VideoOptimizerException;
use Scale\VideoOptimizerBundle\Service\EmbedRenderState;
use Scale\VideoOptimizerBundle\Service\VideoOptimizerEmbedResolver;
use Symfony\Component\Cache\Adapter\ArrayAdapter;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;

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

    public function testFailedLookupsAreCachedBrieflyAndReturnTheFallback(): void
    {
        $client = $this->prophesize(VideoOptimizerClient::class);
        $client->getEmbed('abc')->willThrow(new \RuntimeException('API unreachable'));

        $ttls = [];
        $resolver = new VideoOptimizerEmbedResolver($client->reveal(), $this->recordingCache($ttls));

        self::assertSame(
            ['poster' => null, 'hlsUrl' => null, 'width' => null, 'height' => null, 'duration' => null, 'srcset' => null, 'theme' => null, 'sources' => []],
            $resolver->getSources('abc'),
        );
        self::assertSame([60], $ttls, 'A failure is remembered for 60 s so a broken API is not hit on every render.');
    }

    public function testPlayableVideosAreCachedForAnHour(): void
    {
        $client = $this->prophesize(VideoOptimizerClient::class);
        $client->getEmbed('abc')->willReturn(['sources' => [['src' => 'https://cdn.example.net/master.m3u8', 'type' => 'application/vnd.apple.mpegurl']]]);

        $ttls = [];
        $resolver = new VideoOptimizerEmbedResolver($client->reveal(), $this->recordingCache($ttls));
        $resolver->getSources('abc');

        self::assertSame([3600], $ttls);
    }

    public function testVideosWithoutSourcesAreCachedForOneMinute(): void
    {
        $client = $this->prophesize(VideoOptimizerClient::class);
        $client->getEmbed('abc')->willReturn(['poster' => null, 'sources' => []]);

        $ttls = [];
        $resolver = new VideoOptimizerEmbedResolver($client->reveal(), $this->recordingCache($ttls));
        $resolver->getSources('abc');

        self::assertSame([60], $ttls, 'A video that is not ready yet must not be hidden for long.');
    }

    /**
     * @return iterable<string, array{int}>
     */
    public static function outageStatuses(): iterable
    {
        yield 'transport error' => [502];
        yield 'rate limit' => [429];
        yield 'unavailable' => [503];
        yield 'gateway timeout' => [504];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('outageStatuses')]
    public function testOutagesStopFurtherLookupsForAShortTime(int $status): void
    {
        $client = $this->prophesize(VideoOptimizerClient::class);
        $client->getEmbed('first')->willThrow(new VideoOptimizerException('down', $status))->shouldBeCalledTimes(1);
        $client->getEmbed('second')->shouldNotBeCalled();

        $state = new EmbedRenderState();
        $resolver = new VideoOptimizerEmbedResolver($client->reveal(), new ArrayAdapter(), $state);

        self::assertSame([], $resolver->getSources('first')['sources']);
        self::assertSame([], $resolver->getSources('second')['sources'], 'Fails fast without asking the API.');
        self::assertTrue($state->isDegraded());
    }

    public function testFailFastDoesNotCacheTheSkippedVideoAndRecoversWhenTheFlagExpires(): void
    {
        $cache = new ArrayAdapter();
        $client = $this->prophesize(VideoOptimizerClient::class);
        $client->getEmbed('first')->willThrow(new VideoOptimizerException('down', 502));
        $resolver = new VideoOptimizerEmbedResolver($client->reveal(), $cache);
        $resolver->getSources('first');
        $resolver->getSources('second');

        self::assertFalse($cache->hasItem('vo_embed_v2_second'), 'A skipped video must not be negatively cached.');

        $cache->deleteItem('vo_embed_api_down');
        $client->getEmbed('second')->willReturn(['sources' => [['src' => 'https://cdn.example.net/m.m3u8', 'type' => 'application/vnd.apple.mpegurl']]]);

        self::assertCount(1, $resolver->getSources('second')['sources']);
    }

    public function testAVideoSpecificErrorDoesNotTripFailFast(): void
    {
        $client = $this->prophesize(VideoOptimizerClient::class);
        $client->getEmbed('missing')->willThrow(new VideoOptimizerException('Video not found', 404));
        $client->getEmbed('other')->willReturn(['sources' => [['src' => 'https://cdn.example.net/m.m3u8', 'type' => 'application/vnd.apple.mpegurl']]]);

        $resolver = new VideoOptimizerEmbedResolver($client->reveal(), new ArrayAdapter());
        $resolver->getSources('missing');

        self::assertCount(1, $resolver->getSources('other')['sources']);
    }

    public function testForgetDropsTheCachedEntry(): void
    {
        $client = $this->prophesize(VideoOptimizerClient::class);
        $client->getEmbed('abc')->willReturn(['poster' => 'https://cdn.example.net/old.jpg', 'sources' => [['src' => 'https://cdn.example.net/m.m3u8', 'type' => 'application/vnd.apple.mpegurl']]]);

        $resolver = new VideoOptimizerEmbedResolver($client->reveal(), new ArrayAdapter());
        self::assertSame('https://cdn.example.net/old.jpg', $resolver->getSources('abc')['poster']);

        $client->getEmbed('abc')->willReturn(['poster' => 'https://cdn.example.net/new.jpg', 'sources' => [['src' => 'https://cdn.example.net/m.m3u8', 'type' => 'application/vnd.apple.mpegurl']]]);
        self::assertSame('https://cdn.example.net/old.jpg', $resolver->getSources('abc')['poster'], 'Still served from the cache.');

        $resolver->forget('abc');

        self::assertSame('https://cdn.example.net/new.jpg', $resolver->getSources('abc')['poster']);
    }

    /**
     * A cache that always runs the callback and records the lifetime the resolver asked for.
     *
     * @param list<int|null> $ttls
     */
    private function recordingCache(array &$ttls): CacheInterface
    {
        return new class($ttls) implements CacheInterface {
            /** @param list<int|null> $ttls */
            public function __construct(private array &$ttls)
            {
            }

            public function get(string $key, callable $callback, ?float $beta = null, ?array &$metadata = null): mixed
            {
                $ttls = &$this->ttls;
                $item = new class($ttls) implements ItemInterface {
                    /** @param list<int|null> $ttls */
                    public function __construct(private array &$ttls)
                    {
                    }

                    public function getKey(): string
                    {
                        return 'k';
                    }

                    public function get(): mixed
                    {
                        return null;
                    }

                    public function isHit(): bool
                    {
                        return false;
                    }

                    public function set(mixed $value): static
                    {
                        return $this;
                    }

                    public function expiresAt(?\DateTimeInterface $expiration): static
                    {
                        return $this;
                    }

                    public function expiresAfter(\DateInterval|int|null $time): static
                    {
                        $this->ttls[] = \is_int($time) ? $time : null;

                        return $this;
                    }

                    public function tag(string|iterable $tags): static
                    {
                        return $this;
                    }

                    public function getMetadata(): array
                    {
                        return [];
                    }
                };

                $save = true;

                return $callback($item, $save);
            }

            public function delete(string $key): bool
            {
                return true;
            }
        };
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

    public function testExtractSourcesIncludesThemeAndSources(): void
    {
        $data = [
            'poster' => 'https://cdn/p.jpg',
            'resolution' => '1920x1080',
            'theme' => ['accentColor' => '#f00', 'controls' => true],
            'sources' => [
                ['src' => 'https://cdn/master.m3u8', 'type' => 'application/vnd.apple.mpegurl', 'label' => 'auto'],
                ['src' => 'https://cdn/720.mp4', 'type' => 'video/mp4', 'label' => '720p'],
            ],
        ];

        $result = VideoOptimizerEmbedResolver::extractSources($data);

        self::assertSame('#f00', $result['theme']['accentColor']);
        self::assertCount(2, $result['sources']);
        self::assertSame('https://cdn/master.m3u8', $result['hlsUrl']);
    }

    public function testGetPlayableReturnsPosterSourcesThemeAndDimensions(): void
    {
        $client = $this->prophesize(VideoOptimizerClient::class);
        $client->getEmbed('abc')->willReturn([
            'poster' => 'https://cdn.example.net/poster.jpg',
            'resolution' => '1920x1080',
            'theme' => ['accentColor' => '#f00'],
            'sources' => [
                ['src' => 'https://cdn.example.net/master.m3u8', 'type' => 'application/vnd.apple.mpegurl', 'label' => 'auto'],
            ],
        ]);

        $resolver = new VideoOptimizerEmbedResolver($client->reveal(), new ArrayAdapter());

        self::assertSame(
            [
                'poster' => 'https://cdn.example.net/poster.jpg',
                'sources' => [
                    ['src' => 'https://cdn.example.net/master.m3u8', 'type' => 'application/vnd.apple.mpegurl', 'label' => 'auto'],
                ],
                'theme' => ['accentColor' => '#f00'],
                'width' => 1920,
                'height' => 1080,
            ],
            $resolver->getPlayable('abc'),
        );
    }
}
