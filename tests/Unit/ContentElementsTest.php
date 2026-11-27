<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Tests\Unit;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Prophecy\PhpUnit\ProphecyTrait;
use Prophecy\Prophecy\ObjectProphecy;
use Scale\VideoOptimizerBundle\Api\VideoOptimizerClient;
use Scale\VideoOptimizerBundle\Service\SettingsManager;
use Scale\VideoOptimizerBundle\Service\VideoListProvider;
use Scale\VideoOptimizerBundle\Service\VideoOptimizerEmbedResolver;
use Scale\VideoOptimizerBundle\Twig\VideoOptimizerExtension;
use Symfony\Component\Cache\Adapter\ArrayAdapter;
use Symfony\Component\HttpClient\MockHttpClient;
use Symfony\Component\HttpClient\Response\MockResponse;
use Symfony\Component\HttpFoundation\Request;
use Twig\Environment;
use Twig\Loader\FilesystemLoader;

/**
 * The 2.2.0 content elements: single video, video list and video detail.
 */
class ContentElementsTest extends TestCase
{
    use ProphecyTrait;

    private const UUID = 'e7ab89b1-b74f-42fd-b2a9-53bfe1d492a8';
    private const OTHER = '11111111-2222-4333-8444-555555555555';

    public function testSingleVideoRendersTheFacadeWithCaption(): void
    {
        $html = $this->render('vo_single_video.html.twig', ['block' => [
            'video' => ['uuid' => self::UUID, 'posterUrl' => 'https://cdn.example.net/p.jpg'],
            'headline' => 'Hello',
            'caption' => 'A caption',
            'presentation' => 'facade',
        ]]);

        self::assertStringContainsString('class="vo-block vo-single vo-reveal"', $html);
        self::assertStringContainsString('<h2>Hello</h2>', $html);
        self::assertStringContainsString('data-vo-embed="https://videooptimizer.eu/embed/' . self::UUID . '?autoplay=1"', $html);
        self::assertStringContainsString('A caption', $html);
        self::assertStringContainsString('application/ld+json', $html);
    }

    public function testSingleVideoWithoutVideoRendersNoPlayer(): void
    {
        $html = $this->render('vo_single_video.html.twig', ['block' => ['headline' => 'Only text']]);

        self::assertStringNotContainsString('vo-frame', $html);
    }

    public function testDetailShowsTheVideoFromTheUrl(): void
    {
        $html = $this->render('vo_video_detail.html.twig', ['block' => ['presentation' => 'direct']], '/video?vo_video=' . strtoupper(self::OTHER), [self::OTHER => 'Chosen video']);

        self::assertStringContainsString('<h2>Chosen video</h2>', $html);
        self::assertStringContainsString('/embed/' . self::OTHER, $html);
        self::assertStringNotContainsString('was not found', $html);
    }

    public function testDetailFallsBackToTheDefaultVideoWithoutAUuidInTheUrl(): void
    {
        $html = $this->render('vo_video_detail.html.twig', ['block' => ['video' => ['uuid' => self::UUID, 'title' => 'Default clip']]], '/video');

        self::assertStringContainsString('<h2>Default clip</h2>', $html);
        self::assertStringContainsString('/embed/' . self::UUID, $html);
    }

    /**
     */
    #[DataProvider('notFoundUrls')]
    public function testDetailRendersANeutralNotFoundForInvalidOrUnknownUuids(string $uri): void
    {
        $html = $this->render('vo_video_detail.html.twig', ['block' => ['video' => ['uuid' => self::UUID, 'title' => 'Default clip']]], $uri);

        self::assertStringContainsString('This video was not found.', $html);
        self::assertStringNotContainsString('<iframe', $html);
        self::assertStringNotContainsString('vo-frame', $html);
        self::assertStringNotContainsString('Default clip', $html);
    }

    /**
     * @return iterable<string, array{string}>
     */
    public static function notFoundUrls(): iterable
    {
        yield 'not a uuid' => ['/video?vo_video=<script>alert(1)</script>'];
        yield 'unknown uuid' => ['/video?vo_video=99999999-2222-4333-8444-555555555555'];
        yield 'array' => ['/video?vo_video[]=x'];
    }

    public function testListCardsLinkToTheDetailPageAndPageWithTheCursor(): void
    {
        $html = $this->render('vo_video_list.html.twig', ['block' => ['headline' => 'All videos', 'detailPage' => '/video', 'libraryId' => self::OTHER]], '/videos', [], [
            'items' => [['uuid' => self::UUID, 'title' => 'Clip one', 'poster' => 'https://cdn.example.net/p.jpg', 'duration' => 75]],
            'next' => 'abc123',
            'error' => false,
        ]);

        self::assertStringContainsString('<h2>All videos</h2>', $html);
        self::assertStringContainsString('href="/video?vo_video=' . self::UUID . '"', $html);
        self::assertStringContainsString('>Clip one</a>', $html);
        self::assertStringContainsString('1:15', $html);
        self::assertStringContainsString('src="https://cdn.example.net/poster.jpg"', $html);
        self::assertStringContainsString('srcset="https://cdn.example.net/p-320.jpg 320w"', $html);
        self::assertStringContainsString('href="/videos?vo_cursor=abc123" rel="next"', $html);
        self::assertStringNotContainsString('data-vo-lightbox', $html);
    }

    public function testListCardsOpenTheLightboxWithoutADetailPage(): void
    {
        $html = $this->render('vo_video_list.html.twig', ['block' => []], '/videos', [], [
            'items' => [['uuid' => self::UUID, 'title' => 'Clip one', 'poster' => null, 'duration' => null]],
            'next' => null,
            'error' => false,
        ]);

        self::assertStringContainsString('data-vo-lightbox="https://videooptimizer.eu/embed/' . self::UUID . '?autoplay=1"', $html);
        self::assertStringNotContainsString('rel="next"', $html);
    }

    public function testListShowsAFirstPageLinkOnLaterPages(): void
    {
        $html = $this->render('vo_video_list.html.twig', ['block' => []], '/videos?vo_cursor=abc', [], [
            'items' => [['uuid' => self::UUID, 'title' => 'T', 'poster' => null, 'duration' => null]],
            'next' => null,
            'error' => false,
        ]);

        self::assertStringContainsString('First page', $html);
    }

    public function testListMessagesForEmptyAndFailedLists(): void
    {
        self::assertStringContainsString('No videos found.', $this->render('vo_video_list.html.twig', ['block' => []], '/videos', [], ['items' => [], 'next' => null, 'error' => false]));
        $failed = $this->render('vo_video_list.html.twig', ['block' => []], '/videos', [], ['items' => [], 'next' => null, 'error' => true]);
        self::assertStringContainsString('currently unavailable', $failed);
    }

    public function testTextsFollowThePageLanguage(): void
    {
        self::assertSame('Dieses Video wurde nicht gefunden.', VideoOptimizerExtension::translate('not_found', 'de-DE'));
        self::assertSame('This video was not found.', VideoOptimizerExtension::translate('not_found', 'fr'));
    }

    /**
     */
    #[DataProvider('detailUrls')]
    public function testDetailUrlOnlyAcceptsRelativePathsAndHttpUrls(?string $page, ?string $expected): void
    {
        self::assertSame($expected, $this->extension()->detailUrl($page, self::UUID));
    }

    /**
     * @return iterable<string, array{?string, ?string}>
     */
    public static function detailUrls(): iterable
    {
        yield 'path' => ['/video', '/video?vo_video=' . self::UUID];
        yield 'path with query' => ['/video?a=1', '/video?a=1&vo_video=' . self::UUID];
        yield 'replaces an earlier uuid' => ['/video?vo_video=old', '/video?vo_video=' . self::UUID];
        yield 'absolute' => ['https://example.com/v', 'https://example.com/v?vo_video=' . self::UUID];
        yield 'fragment dropped' => ['/video#x', '/video?vo_video=' . self::UUID];
        yield 'javascript' => ['javascript:alert(1)', null];
        yield 'protocol relative' => ['//evil.example', null];
        yield 'data' => ['data:text/html,x', null];
        yield 'whitespace' => ["/a b", null];
        yield 'backslash' => ['/\\evil.example', null];
        yield 'empty' => ['', null];
        yield 'null' => [null, null];
    }

    public function testListProviderKeepsFinishedVideosAndValidatesItsInput(): void
    {
        $queries = [];
        $provider = new VideoListProvider($this->client(function (string $m, string $u) use (&$queries): MockResponse {
            $queries[] = $u;

            return new MockResponse(json_encode([
                'data' => [
                    ['uuid' => self::UUID, 'title' => 'Ready', 'status' => 'ready', 'duration' => 12.4, 'poster_url' => 'https://cdn.example.net/p.jpg'],
                    ['uuid' => self::OTHER, 'title' => 'Busy', 'status' => 'processing'],
                    ['uuid' => 'not-a-uuid', 'title' => 'Bad', 'status' => 'ready'],
                ],
                'pagination' => ['next_cursor' => 'next1', 'has_more' => true],
            ], \JSON_THROW_ON_ERROR));
        }), new ArrayAdapter());

        $page = $provider->page(self::OTHER, ' a,b ', 'bad cursor!', 500);
        $again = $provider->page(self::OTHER, 'a,b', null, 24);

        self::assertSame([['uuid' => self::UUID, 'title' => 'Ready', 'poster' => 'https://cdn.example.net/p.jpg', 'duration' => 12]], $page['items']);
        self::assertSame('next1', $page['next']);
        self::assertFalse($page['error']);
        self::assertCount(1, $queries, 'The invalid cursor is dropped and the page size clamped, so both calls share one cached page.');
        self::assertStringContainsString('limit=24', $queries[0]);
        self::assertStringContainsString('library_id=' . self::OTHER, $queries[0]);
        self::assertStringNotContainsString('cursor', $queries[0]);
        self::assertSame($page['items'], $again['items']);
    }

    public function testListProviderReportsAFailureWithoutCachingIt(): void
    {
        $calls = 0;
        $provider = new VideoListProvider($this->client(function () use (&$calls): MockResponse {
            ++$calls;

            return new MockResponse('{}', ['http_code' => 503]);
        }), new ArrayAdapter());

        self::assertTrue($provider->page(null, null, null)['error']);
        self::assertTrue($provider->page(null, null, null)['error']);
        self::assertSame(2, $calls);
    }

    /**
     * @param array<string, mixed>                $context
     * @param array<string, string>               $titles  title per uuid; uuids without one count as unknown videos
     * @param array<string, mixed>|null           $list
     */
    private function render(string $template, array $context, string $uri = '/', array $titles = [], ?array $list = null): string
    {
        $loader = new FilesystemLoader();
        $loader->addPath(\dirname(__DIR__, 2) . '/src/Resources/views', 'ScaleVideoOptimizer');
        $twig = new Environment($loader, ['autoescape' => 'html', 'strict_variables' => false]);
        $twig->addExtension($this->extension($titles, $list));

        $context['app'] = (object) ['request' => Request::create($uri)];

        return $twig->render('@ScaleVideoOptimizer/blocks/' . $template, $context);
    }

    /**
     * @param array<string, string>     $titles
     * @param array<string, mixed>|null $list
     */
    private function extension(array $titles = [], ?array $list = null): VideoOptimizerExtension
    {
        $resolver = $this->prophesize(VideoOptimizerEmbedResolver::class);
        $resolver->getDimensions(\Prophecy\Argument::any())->willReturn(['width' => 1920, 'height' => 1080, 'orientation' => 'landscape']);
        $resolver->getPosterSrcset(\Prophecy\Argument::any())->willReturn('https://cdn.example.net/p-320.jpg 320w');
        $resolver->getSources(\Prophecy\Argument::any())->will(static fn (array $args): array => [
            'title' => $titles[$args[0]] ?? null,
            'poster' => 'https://cdn.example.net/poster.jpg', 'hlsUrl' => null, 'width' => 1920, 'height' => 1080,
            'duration' => 120, 'srcset' => null, 'theme' => null, 'tracks' => [], 'sources' => [],
        ]);

        $settings = $this->prophesize(SettingsManager::class);
        $settings->getDefaultPlayer()->willReturn('hosted');

        /** @var ObjectProphecy<VideoListProvider> $provider */
        $provider = $this->prophesize(VideoListProvider::class);
        $provider->page(\Prophecy\Argument::cetera())->willReturn($list ?? ['items' => [], 'next' => null, 'error' => false]);

        return new VideoOptimizerExtension('https://videooptimizer.eu', $resolver->reveal(), $settings->reveal(), null, 'https://api.videooptimizer.eu/api/v1', $provider->reveal());
    }

    private function client(callable $callback): VideoOptimizerClient
    {
        $settings = $this->prophesize(SettingsManager::class);
        $settings->getApiToken()->willReturn('vp_test-token');

        return new VideoOptimizerClient(new MockHttpClient($callback), $settings->reveal(), 'https://api.videooptimizer.eu/api/v1');
    }
}
