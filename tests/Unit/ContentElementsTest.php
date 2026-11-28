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
        self::assertStringContainsString('<!--vo-assets-->', $html, 'The styles must load even though no player is rendered.');
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
        $html = $this->render('vo_video_list.html.twig', ['block' => ['headline' => 'All videos', 'detailPage' => ['id' => self::OTHER, 'title' => 'Detail', 'url' => '/video'], 'libraryId' => self::OTHER]], '/videos', [], [
            'items' => [['uuid' => self::UUID, 'title' => 'Clip one', 'poster' => 'https://cdn.example.net/p.jpg', 'duration' => 75]],
            'next' => 'abc123',
            'error' => false,
        ]);

        self::assertStringContainsString('<h2>All videos</h2>', $html);
        self::assertStringContainsString('href="/de/video?vo_video=' . self::UUID . '"', $html, 'The slug goes through sulu_content_path (locale prefix).');
        self::assertStringContainsString('>Clip one</a>', $html);
        self::assertSame(1, substr_count($html, '<a ') - substr_count($html, 'vo-btn'), 'One link per card: a single tab stop (the pager links are extra).');
        self::assertStringContainsString('1:15', $html);
        self::assertStringContainsString('src="https://cdn.example.net/p.jpg"', $html, 'The card uses the poster of the list item.');
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

        self::assertStringContainsString('<button type="button" class="vo-list__card" data-vo-lightbox="https://videooptimizer.eu/embed/' . self::UUID . '?autoplay=1"', $html);
        self::assertStringNotContainsString('rel="next"', $html);
    }

    public function testRenderingAListMakesNoPerVideoEmbedLookup(): void
    {
        $resolver = $this->prophesize(VideoOptimizerEmbedResolver::class);
        $resolver->getSources(\Prophecy\Argument::any())->shouldNotBeCalled();
        $resolver->getDimensions(\Prophecy\Argument::any())->shouldNotBeCalled();
        $resolver->getPosterSrcset(\Prophecy\Argument::any())->shouldNotBeCalled();
        $resolver->peekPosterSrcset(\Prophecy\Argument::any())->willReturn(null);
        $settings = $this->prophesize(SettingsManager::class);
        $settings->getDefaultPlayer()->willReturn('hosted');
        $provider = $this->prophesize(VideoListProvider::class);
        $provider->page(\Prophecy\Argument::cetera())->willReturn(['items' => [
            ['uuid' => self::UUID, 'title' => 'One', 'poster' => 'https://cdn.example.net/1.jpg', 'duration' => 5],
            ['uuid' => self::OTHER, 'title' => '', 'poster' => null, 'duration' => null],
        ], 'next' => null, 'error' => false]);

        $loader = new FilesystemLoader();
        $loader->addPath(\dirname(__DIR__, 2) . '/src/Resources/views', 'ScaleVideoOptimizer');
        $twig = new Environment($loader, ['autoescape' => 'html', 'strict_variables' => false]);
        $twig->addExtension(new VideoOptimizerExtension('https://videooptimizer.eu', $resolver->reveal(), $settings->reveal(), null, 'https://api.videooptimizer.eu/api/v1', $provider->reveal()));

        $html = $twig->render('@ScaleVideoOptimizer/blocks/vo_video_list.html.twig', ['block' => [], 'app' => (object) ['request' => Request::create('/videos')]]);

        self::assertSame(2, substr_count($html, 'class="vo-list__card"'));
        self::assertStringContainsString('Play video', $html, 'A card without a title still has a label.');
    }

    public function testPagerKeepsTheBasePathAndOtherQueryParameters(): void
    {
        $html = $this->render('vo_video_list.html.twig', ['block' => []], '/sub/videos?tag=a&vo_cursor=old', [], [
            'items' => [['uuid' => self::UUID, 'title' => 'T', 'poster' => null, 'duration' => null]],
            'next' => 'n3xt',
            'error' => false,
        ]);

        self::assertStringContainsString('href="/sub/videos?tag=a&amp;vo_cursor=n3xt" rel="next"', $html);
        self::assertStringContainsString('href="/sub/videos?tag=a">First page', $html);
    }

    public function testCursorUrl(): void
    {
        self::assertSame('/videos', VideoOptimizerExtension::cursorUrl('/videos?vo_cursor=a', null));
        self::assertSame('/videos?vo_cursor=b', VideoOptimizerExtension::cursorUrl('/videos', 'b'));
        self::assertSame('/x/videos?a=1&vo_cursor=b', VideoOptimizerExtension::cursorUrl('/x/videos?a=1&vo_cursor=a#frag', 'b'));
    }

    public function testDetailNeverRendersTheDataOfAVideoThatIsNotVerified(): void
    {
        // The embed knows a title for it, but the ownership check says it is not ours.
        $html = $this->render('vo_video_detail.html.twig', ['block' => ['video' => ['uuid' => self::UUID, 'title' => 'Default clip']]], '/video?vo_video=' . self::OTHER, [self::OTHER => 'Secret foreign title'], null, 120.0, [self::OTHER => 'missing']);

        self::assertStringContainsString('This video was not found.', $html);
        foreach (['Secret foreign title', 'Default clip', '<iframe', 'application/ld+json', self::OTHER] as $leak) {
            self::assertStringNotContainsString($leak, $html, $leak);
        }
    }

    public function testDetailDuringAnOutageSaysTemporarilyUnavailable(): void
    {
        $html = $this->render('vo_video_detail.html.twig', ['block' => []], '/video?vo_video=' . self::OTHER, [self::OTHER => 'Title'], null, 120.0, [self::OTHER => 'unavailable']);

        self::assertStringContainsString('This video is temporarily unavailable.', $html);
        self::assertStringNotContainsString('Title', $html);
        self::assertStringNotContainsString('<iframe', $html);
    }

    public function testDetailDoesNotBorrowTheDefaultVideosTitleForARequestedVideo(): void
    {
        $html = $this->render('vo_video_detail.html.twig', ['block' => ['video' => ['uuid' => self::UUID, 'title' => 'Default clip']]], '/video?vo_video=' . self::OTHER, [self::OTHER => '']);

        self::assertStringNotContainsString('Default clip', $html);
        self::assertStringContainsString('/embed/' . self::OTHER, $html);
    }

    public function testDetailRendersAVideoWithAnEmptyTitle(): void
    {
        $html = $this->render('vo_video_detail.html.twig', ['block' => []], '/video?vo_video=' . self::OTHER, [self::OTHER => '']);

        self::assertStringContainsString('/embed/' . self::OTHER, $html);
        self::assertStringNotContainsString('<h2>', $html);
        self::assertStringNotContainsString('was not found', $html);
    }

    public function testDetailIsTheMainContentSoItDoesNotFadeIn(): void
    {
        $html = $this->render('vo_video_detail.html.twig', ['block' => ['video' => ['uuid' => self::UUID]]], '/video');

        self::assertStringNotContainsString('vo-reveal', $html);
        self::assertStringContainsString('fetchpriority', $html . 'fetchpriority', 'priority players load eagerly');
        self::assertStringContainsString('loading="eager"', $html);
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
        $extension = $this->extension();
        self::assertSame('Dieses Video wurde nicht gefunden.', $extension->translate('not_found', 'de-DE'));
        self::assertSame('This video was not found.', $extension->translate('not_found', 'fr'));
        self::assertSame('Szene 2 · 1:05', $extension->translate('scene', 'de', ['n' => '2', 'time' => '1:05']));
    }

    public function testTextsCanBeOverriddenWithASymfonyTranslation(): void
    {
        $translator = new \Symfony\Component\Translation\Translator('de');
        $translator->addLoader('array', new \Symfony\Component\Translation\Loader\ArrayLoader());
        $translator->addResource('array', ['next' => 'Mehr laden'], 'de', 'scale_video_optimizer');

        $extension = $this->extension(translator: $translator);

        self::assertSame('Mehr laden', $extension->translate('next', 'de'));
        self::assertSame('Erste Seite', $extension->translate('first', 'de'), 'Keys the project does not override use the bundle catalog.');
    }

    /**
     */
    #[DataProvider('detailUrls')]
    public function testDetailUrlOnlyAcceptsRelativePathsAndHttpUrls(mixed $page, ?string $expected): void
    {
        self::assertSame($expected, $this->extension()->detailUrl($page, self::UUID));
    }

    /**
     * @return iterable<string, array{mixed, ?string}>
     */
    public static function detailUrls(): iterable
    {
        yield 'resolved page' => [['id' => self::OTHER, 'title' => 'Video', 'url' => '/de/video'], '/de/video?vo_video=' . self::UUID];
        yield 'resolved page object' => [new \ArrayObject(['url' => '/video']), '/video?vo_video=' . self::UUID];
        yield 'page object' => [(object) ['url' => '/video'], '/video?vo_video=' . self::UUID];
        yield 'resolved page without url' => [['id' => self::OTHER], null];
        yield 'unresolved page uuid' => [self::OTHER, null];
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
                'pagination' => ['next_cursor' => null, 'has_more' => false],
            ], \JSON_THROW_ON_ERROR));
        }), new ArrayAdapter());

        $page = $provider->page(self::OTHER, ' a,b ', 'bad cursor!', 500);
        $again = $provider->page(self::OTHER, 'a,b', null, 24);

        self::assertSame([['uuid' => self::UUID, 'title' => 'Ready', 'poster' => 'https://cdn.example.net/p.jpg', 'duration' => 12]], $page['items']);
        self::assertNull($page['next']);
        self::assertFalse($page['error']);
        self::assertCount(1, $queries, 'The invalid cursor is dropped and the page size clamped, so both calls share one cached page.');
        self::assertStringContainsString('limit=24', $queries[0]);
        self::assertStringContainsString('library_id=' . self::OTHER, $queries[0]);
        self::assertStringNotContainsString('cursor', $queries[0]);
        self::assertSame($page['items'], $again['items']);
    }

    public function testListProviderReadsFurtherApiPagesToFindReadyVideos(): void
    {
        $queries = [];
        $pages = [
            ['data' => [['uuid' => self::OTHER, 'status' => 'processing']], 'pagination' => ['next_cursor' => 'c1', 'has_more' => true]],
            ['data' => [['uuid' => self::OTHER, 'status' => 'failed']], 'pagination' => ['next_cursor' => 'c2', 'has_more' => true]],
            ['data' => [['uuid' => self::UUID, 'title' => 'Ready', 'status' => 'ready']], 'pagination' => ['next_cursor' => 'c3', 'has_more' => true]],
            ['data' => [['uuid' => self::UUID, 'status' => 'ready']], 'pagination' => ['next_cursor' => null, 'has_more' => false]],
        ];
        $provider = new VideoListProvider($this->client(function (string $m, string $u) use (&$queries, &$pages): MockResponse {
            $queries[] = $u;

            return new MockResponse(json_encode(array_shift($pages), \JSON_THROW_ON_ERROR));
        }), new ArrayAdapter());

        $page = $provider->page(null, null, null, 3);

        self::assertCount(3, $queries, 'At most three API calls per render.');
        self::assertSame(['Ready'], array_column($page['items'], 'title'));
        self::assertSame('c3', $page['next'], 'The next link continues after the last page read.');
        self::assertStringContainsString('cursor=c1', $queries[1]);
        self::assertStringContainsString('cursor=c2', $queries[2]);
    }

    public function testListProviderStopsReadingOnceThePageIsFull(): void
    {
        $queries = [];
        $provider = new VideoListProvider($this->client(function (string $m, string $u) use (&$queries): MockResponse {
            $queries[] = $u;

            return new MockResponse(json_encode([
                'data' => [['uuid' => self::UUID, 'status' => 'ready'], ['uuid' => self::OTHER, 'status' => 'ready']],
                'pagination' => ['next_cursor' => 'more', 'has_more' => true],
            ], \JSON_THROW_ON_ERROR));
        }), new ArrayAdapter());

        $page = $provider->page(null, null, null, 2);

        self::assertCount(1, $queries);
        self::assertCount(2, $page['items']);
        self::assertSame('more', $page['next']);
    }

    public function testListProviderShowsNothingForAnInvalidLibraryInsteadOfEveryLibrary(): void
    {
        $calls = 0;
        $provider = new VideoListProvider($this->client(function () use (&$calls): MockResponse {
            ++$calls;

            return new MockResponse('{}');
        }), new ArrayAdapter());

        self::assertSame(['items' => [], 'next' => null, 'error' => false], $provider->page('typo', null, null));
        self::assertSame(0, $calls);
    }

    #[DataProvider('badCursors')]
    public function testListProviderDropsMalformedCursors(string $cursor): void
    {
        $queries = [];
        $provider = new VideoListProvider($this->client(function (string $m, string $u) use (&$queries): MockResponse {
            $queries[] = $u;

            return new MockResponse(json_encode(['data' => [], 'pagination' => ['next_cursor' => null, 'has_more' => false]], \JSON_THROW_ON_ERROR));
        }), new ArrayAdapter());

        $provider->page(null, null, $cursor);

        self::assertStringNotContainsString('cursor', $queries[0]);
    }

    /**
     * @return iterable<string, array{string}>
     */
    public static function badCursors(): iterable
    {
        yield 'spaces' => ['a b'];
        yield 'slash' => ['a/b'];
        yield 'plus' => ['a+b'];
        yield 'query injection' => ['a&limit=100'];
        yield 'too long' => [str_repeat('a', 201)];
        yield 'empty' => [''];
    }

    public function testListProviderCapsThePageLifetimeAndCachesPerCursor(): void
    {
        $queries = [];
        $state = new \Scale\VideoOptimizerBundle\Service\EmbedRenderState();
        $provider = new VideoListProvider($this->client(function (string $m, string $u) use (&$queries): MockResponse {
            $queries[] = $u;

            return new MockResponse(json_encode(['data' => [], 'pagination' => ['next_cursor' => null, 'has_more' => false]], \JSON_THROW_ON_ERROR));
        }), new ArrayAdapter(), $state);

        $provider->page(null, null, null);
        $provider->page(null, null, 'abc');
        $provider->page(null, null, 'abc');

        self::assertCount(2, $queries, 'One cached page per cursor.');
        self::assertSame(VideoListProvider::TTL, $state->maxLifetime());
        self::assertSame(120, VideoListProvider::TTL);
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

    public function testScenesSpreadTheThumbnailsEvenlyAndStartWhereTheEncoderSampled(): void
    {
        $scenes = $this->extension()->scenes(['uuid' => self::UUID], 5, null, 'en');

        self::assertSame([0, 2, 5, 7, 9], array_column($scenes, 'index'));
        // duration 120: floor(120 / 11 * (i + 1))
        self::assertSame([10, 32, 65, 87, 109], array_column($scenes, 'start'));
        self::assertSame('0:10', $scenes[0]['time']);
        self::assertSame('Scene 1 · 0:10', $scenes[0]['label']);
        self::assertSame('https://api.videooptimizer.eu/api/v1/videos/' . self::UUID . '/thumbnails/7', $scenes[3]['src']);
    }

    public function testSceneCountIsClampedAndAllTenAreAvailable(): void
    {
        $extension = $this->extension();

        self::assertCount(3, $extension->scenes(['uuid' => self::UUID], 1));
        self::assertCount(10, $extension->scenes(['uuid' => self::UUID], 99));
        self::assertSame(range(0, 9), array_column($extension->scenes(['uuid' => self::UUID], 10), 'index'));
        self::assertCount(5, $extension->scenes(['uuid' => self::UUID], 'x'));
        self::assertCount(5, $extension->scenes(['uuid' => self::UUID], 0), 'A block saved before the field existed gets the default.');
        self::assertCount(5, $extension->scenes(['uuid' => self::UUID], null));
    }

    public function testSceneTitlesReplaceTheNumberedLabelAndTranslateToGerman(): void
    {
        $scenes = $this->extension()->scenes(['uuid' => self::UUID], 3, "Intro

Finale", 'de');

        self::assertSame('Intro', $scenes[0]['title']);
        self::assertSame('Intro · 0:10', $scenes[0]['label']);
        self::assertSame('', $scenes[1]['title']);
        self::assertSame('Szene 2 · 1:05', $scenes[1]['label']);
        self::assertSame('Finale · 1:49', $scenes[2]['label']);
    }

    public function testSceneStartsUseTheExactFractionalDuration(): void
    {
        // 131.9 / 11 * 10 = 119.9: rounding the duration first would give 120.
        $scenes = $this->extension([], null, 131.9)->scenes(['uuid' => self::UUID], 3);

        self::assertSame([11, 71, 119], array_column($scenes, 'start'));
    }

    public function testNoScenesWithoutDurationOrVideo(): void
    {
        self::assertSame([], $this->extension([], null, 0.0)->scenes(['uuid' => self::UUID]));
        self::assertSame([], $this->extension()->scenes(null));
    }

    public function testTimeLabels(): void
    {
        self::assertSame('0:00', VideoOptimizerExtension::timeLabel(0));
        self::assertSame('1:05', VideoOptimizerExtension::timeLabel(65));
        self::assertSame('1:01:01', VideoOptimizerExtension::timeLabel(3661));
        self::assertSame('0:00', VideoOptimizerExtension::timeLabel(-5));
    }

    public function testChaptersBlockRendersTheDirectPlayerAndTheSceneButtons(): void
    {
        $html = $this->render('vo_video_chapters.html.twig', ['block' => ['video' => ['uuid' => self::UUID], 'headline' => 'Tour', 'sceneCount' => 3, 'sceneTitles' => "A
B"]]);

        self::assertStringContainsString('data-vo-chapters data-vo-chapters-embed="https://videooptimizer.eu/embed/' . self::UUID . '?autoplay=1"', $html);
        self::assertSame(3, substr_count($html, 'data-vo-start="'));
        self::assertStringContainsString('data-vo-start="10" aria-label="A · 0:10"', $html);
        self::assertStringContainsString('src="https://api.videooptimizer.eu/api/v1/videos/' . self::UUID . '/thumbnails/0" width="320" height="180" alt="" loading="lazy" decoding="async"', $html);
        self::assertStringContainsString('<ul class="vo-chapters__scenes" aria-label="Scenes">', $html);
        self::assertStringContainsString('<iframe', $html);
    }

    public function testChaptersBlockOmitsTheRowWithoutADuration(): void
    {
        $html = $this->render('vo_video_chapters.html.twig', ['block' => ['video' => ['uuid' => self::UUID]]], '/', [], null, 0.0);

        self::assertStringNotContainsString('vo-chapters__scenes', $html);
        self::assertStringContainsString('vo-frame', $html);
    }

    public function testFormatOptionsMapToRatioTallnessAndFocus(): void
    {
        $extension = $this->extension();

        self::assertSame(['key' => 'original', 'ratio' => null, 'tall' => false, 'focus' => null], $extension->format([]));
        self::assertSame(['key' => 'original', 'ratio' => null, 'tall' => false, 'focus' => null], $extension->format(['format' => 'bogus']));
        self::assertSame(['key' => '9_16', 'ratio' => '9 / 16', 'tall' => true, 'focus' => null], $extension->format(['format' => '9_16']));
        self::assertSame(['key' => '4_5', 'ratio' => '4 / 5', 'tall' => true, 'focus' => '20% 80%'], $extension->format(['format' => '4_5', 'focusX' => '20', 'focusY' => 80]));
        self::assertFalse($extension->format(['format' => '21_9'])['tall']);
        self::assertSame('0% 100%', $extension->format(['focusX' => -30, 'focusY' => 250])['focus'], 'Out-of-range values are clamped.');
        self::assertNull($extension->format(['focusX' => 'abc', 'focusY' => null])['focus'], 'Garbage counts as the centre.');
    }

    public function testPlayerOptionsAskTheEmbedToCoverOnlyForAFixedFormat(): void
    {
        $extension = $this->extension();

        self::assertArrayNotHasKey('fit', $extension->playerOptions(['format' => 'original']));
        self::assertSame('cover', $extension->playerOptions(['format' => '1_1'])['fit']);
    }

    public function testSingleVideoWithAFormatSizesTheSurfaceAndCoversTheHostedEmbed(): void
    {
        $html = $this->render('vo_single_video.html.twig', ['block' => [
            'video' => ['uuid' => self::UUID], 'presentation' => 'direct', 'priority' => true, 'format' => '9_16', 'focusX' => 30, 'focusY' => 10,
        ]]);

        self::assertStringContainsString('class="vo-frame vo-frame--format vo-frame--tall"', $html);
        self::assertStringContainsString('style="aspect-ratio: 9 / 16; --vo-focus: 30% 10%"', $html);
        self::assertStringContainsString('src="https://videooptimizer.eu/embed/' . self::UUID . '?autoplay=1&amp;fit=cover"', $html);
    }

    public function testFacadeCoversButTheLightboxShowsTheWholeVideo(): void
    {
        $facade = $this->render('vo_single_video.html.twig', ['block' => ['video' => ['uuid' => self::UUID], 'presentation' => 'facade', 'format' => '1_1']]);
        $lightbox = $this->render('vo_single_video.html.twig', ['block' => ['video' => ['uuid' => self::UUID], 'presentation' => 'lightbox', 'format' => '1_1']]);

        self::assertStringContainsString('data-vo-embed="https://videooptimizer.eu/embed/' . self::UUID . '?autoplay=1&amp;fit=cover"', $facade);
        self::assertStringContainsString('style="aspect-ratio: 1 / 1"', $lightbox);
        self::assertStringContainsString('data-vo-lightbox="https://videooptimizer.eu/embed/' . self::UUID . '?autoplay=1"', $lightbox);
    }

    public function testDirectHostedAutoloadKeepsCover(): void
    {
        $html = $this->render('vo_media_split.html.twig', ['block' => ['video' => ['uuid' => self::UUID], 'presentation' => 'direct', 'format' => '21_9']]);

        self::assertStringContainsString('data-vo-autoload="https://videooptimizer.eu/embed/' . self::UUID . '?autoplay=1&amp;fit=cover"', $html);
        self::assertStringNotContainsString('vo-frame--tall', $html);
    }

    public function testOriginalFormatKeepsTheVideoRatioAndOrientationClass(): void
    {
        $html = $this->render('vo_single_video.html.twig', ['block' => ['video' => ['uuid' => self::UUID], 'presentation' => 'facade', 'format' => 'original']]);

        self::assertStringContainsString('class="vo-frame vo-frame--landscape" style="aspect-ratio: 1920 / 1080"', $html);
    }

    public function testFloatingWrapsTheDirectPlayerInAPlaceholderBox(): void
    {
        $html = $this->render('vo_single_video.html.twig', ['block' => ['video' => ['uuid' => self::UUID], 'presentation' => 'direct', 'floating' => true]]);

        self::assertMatchesRegularExpression('#<div class="vo-float" data-vo-float>\s*<div class="vo-frame[^>]*>.*</div>\s*</div>\s*<script type="application/ld\+json">#s', $html);
    }

    public function testFloatingIsIgnoredForFacadeAndLightbox(): void
    {
        foreach (['facade', 'lightbox'] as $presentation) {
            $html = $this->render('vo_single_video.html.twig', ['block' => ['video' => ['uuid' => self::UUID], 'presentation' => $presentation, 'floating' => true]]);
            self::assertStringNotContainsString('data-vo-float', $html, $presentation);
        }
        self::assertStringNotContainsString('data-vo-float', $this->render('vo_single_video.html.twig', ['block' => ['video' => ['uuid' => self::UUID], 'presentation' => 'direct']]));
    }

    public function testChaptersCanFloatToo(): void
    {
        $html = $this->render('vo_video_chapters.html.twig', ['block' => ['video' => ['uuid' => self::UUID], 'floating' => true]]);

        self::assertStringContainsString('data-vo-float', $html);
        self::assertStringContainsString('data-vo-chapters', $html);
    }

    /**
     * @param array<string, mixed>                $context
     * @param array<string, string>               $titles  title per uuid; uuids without one count as unknown videos
     * @param array<string, mixed>|null           $list
     */
    private function render(string $template, array $context, string $uri = '/', array $titles = [], ?array $list = null, float $duration = 120.0, array $verdicts = []): string
    {
        $loader = new FilesystemLoader();
        $loader->addPath(\dirname(__DIR__, 2) . '/src/Resources/views', 'ScaleVideoOptimizer');
        $twig = new Environment($loader, ['autoescape' => 'html', 'strict_variables' => false]);
        $twig->addExtension($this->extension($titles, $list, $duration, null, $verdicts));
        // Sulu's route generator: prefixes the locale of a `{localization}` URL scheme.
        $twig->addFunction(new \Twig\TwigFunction('sulu_content_path', static fn (string $slug): string => '/de' . $slug));

        $context['app'] = (object) ['request' => Request::create($uri)];

        return $twig->render('@ScaleVideoOptimizer/blocks/' . $template, $context);
    }

    /**
     * @param array<string, string>     $titles
     * @param array<string, mixed>|null $list
     */
    private function extension(array $titles = [], ?array $list = null, float $duration = 120.0, ?\Symfony\Contracts\Translation\TranslatorInterface $translator = null, array $verdicts = []): VideoOptimizerExtension
    {
        $resolver = $this->prophesize(VideoOptimizerEmbedResolver::class);
        $resolver->getDimensions(\Prophecy\Argument::any())->willReturn(['width' => 1920, 'height' => 1080, 'orientation' => 'landscape']);
        $resolver->getPosterSrcset(\Prophecy\Argument::any())->willReturn('https://cdn.example.net/p-320.jpg 320w');
        $resolver->peekPosterSrcset(\Prophecy\Argument::any())->willReturn('https://cdn.example.net/p-320.jpg 320w');
        $resolver->getSources(\Prophecy\Argument::any())->will(static fn (array $args): array => [
            'title' => $titles[$args[0]] ?? null,
            'poster' => 'https://cdn.example.net/poster.jpg', 'hlsUrl' => null, 'width' => 1920, 'height' => 1080,
            'duration' => $duration, 'srcset' => null, 'theme' => null, 'tracks' => [],
            'sources' => \array_key_exists($args[0], $titles) || self::UUID === $args[0] ? [['src' => 'https://cdn.example.net/m.m3u8', 'type' => 'application/vnd.apple.mpegurl', 'label' => 'auto']] : [],
        ]);

        $settings = $this->prophesize(SettingsManager::class);
        $settings->getDefaultPlayer()->willReturn('hosted');

        $ownership = $this->prophesize(\Scale\VideoOptimizerBundle\Service\VideoOwnership::class);
        $ownership->check(\Prophecy\Argument::cetera())->will(static fn (array $args): string => $verdicts[$args[0]]
            ?? (\array_key_exists($args[0], $titles) || self::UUID === $args[0] ? 'ok' : 'missing'));

        /** @var ObjectProphecy<VideoListProvider> $provider */
        $provider = $this->prophesize(VideoListProvider::class);
        $provider->page(\Prophecy\Argument::cetera())->willReturn($list ?? ['items' => [], 'next' => null, 'error' => false]);

        return new VideoOptimizerExtension('https://videooptimizer.eu', $resolver->reveal(), $settings->reveal(), null, 'https://api.videooptimizer.eu/api/v1', $provider->reveal(), $translator, $ownership->reveal());
    }

    private function client(callable $callback): VideoOptimizerClient
    {
        $settings = $this->prophesize(SettingsManager::class);
        $settings->getApiToken()->willReturn('vp_test-token');

        return new VideoOptimizerClient(new MockHttpClient($callback), $settings->reveal(), 'https://api.videooptimizer.eu/api/v1');
    }
}
