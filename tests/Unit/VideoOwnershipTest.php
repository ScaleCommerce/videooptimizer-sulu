<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Prophecy\PhpUnit\ProphecyTrait;
use Scale\VideoOptimizerBundle\Api\VideoOptimizerClient;
use Scale\VideoOptimizerBundle\Api\VideoOptimizerException;
use Scale\VideoOptimizerBundle\Service\EmbedRenderState;
use Scale\VideoOptimizerBundle\Service\SettingsManager;
use Scale\VideoOptimizerBundle\Service\VideoOwnership;
use Symfony\Component\Cache\Adapter\ArrayAdapter;

class VideoOwnershipTest extends TestCase
{
    use ProphecyTrait;

    private const UUID = 'e7ab89b1-b74f-42fd-b2a9-53bfe1d492a8';
    private const LIBRARY = '11111111-2222-4333-8444-555555555555';

    public function testAReadyVideoOfTheOrganizationIsOkAndRemembered(): void
    {
        $client = $this->prophesize(VideoOptimizerClient::class);
        $client->getVideo(self::UUID)->willReturn(['status' => 'ready', 'library_id' => self::LIBRARY])->shouldBeCalledTimes(1);
        $ownership = new VideoOwnership($client->reveal(), new ArrayAdapter());

        self::assertSame('ok', $ownership->check(self::UUID));
        self::assertSame('ok', $ownership->check(strtoupper(self::UUID)));
    }

    public function testAForeignOrUnknownVideoIsMissingAndRememberedForAWhile(): void
    {
        $client = $this->prophesize(VideoOptimizerClient::class);
        $client->getVideo(self::UUID)->willThrow(new VideoOptimizerException('not found', 404))->shouldBeCalledTimes(1);
        $ownership = new VideoOwnership($client->reveal(), new ArrayAdapter());

        self::assertSame('missing', $ownership->check(self::UUID));
        self::assertSame('missing', $ownership->check(self::UUID));
    }

    public function testAVideoThatIsNotReadyIsTemporaryAndTheirPageShortLivedAndTagged(): void
    {
        $client = $this->prophesize(VideoOptimizerClient::class);
        $client->getVideo(self::UUID)->willReturn(['status' => 'processing', 'library_id' => self::LIBRARY]);
        $state = new EmbedRenderState();
        $store = $this->prophesize(\Sulu\Bundle\HttpCacheBundle\ReferenceStore\ReferenceStoreInterface::class);
        $store->add(self::UUID, 'video_optimizer')->shouldBeCalled();

        $result = (new VideoOwnership($client->reveal(), new ArrayAdapter(), $state, null, $store->reveal()))->check(self::UUID);

        self::assertSame('unavailable', $result);
        self::assertTrue($state->isDegraded(), 'The page is cached for 60 s at most.');
    }

    public function testAnExhaustedRateLimitIsUnavailableAndDegradesThePageNeverMissing(): void
    {
        $client = $this->prophesize(VideoOptimizerClient::class);
        $client->getVideo(\Prophecy\Argument::any())->willThrow(new VideoOptimizerException('not found', 404));
        $state = new EmbedRenderState();
        $ownership = new VideoOwnership($client->reveal(), new ArrayAdapter(), $state);
        for ($i = 0; $i < VideoOwnership::MAX_NEW_PER_MINUTE; ++$i) {
            $ownership->check(sprintf('00000000-0000-4000-8000-%012d', $i));
        }
        $state->reset();

        self::assertSame('unavailable', $ownership->check(self::UUID));
        self::assertTrue($state->isDegraded());
    }

    public function testVerdictsAreScopedToTheTokenAndForgottenOnDemand(): void
    {
        $cache = new ArrayAdapter();
        $client = $this->prophesize(VideoOptimizerClient::class);
        $client->getVideo(self::UUID)->willReturn(['status' => 'ready', 'library_id' => self::LIBRARY])->shouldBeCalledTimes(3);
        $settings = $this->prophesize(SettingsManager::class);
        $settings->getApiToken()->willReturn('vp_one', 'vp_one', 'vp_two', 'vp_two', 'vp_two', 'vp_two');

        $ownership = new VideoOwnership($client->reveal(), $cache, null, $settings->reveal());

        self::assertSame('ok', $ownership->check(self::UUID)); // call 1 (token one)
        self::assertSame('ok', $ownership->check(self::UUID)); // cached
        self::assertSame('ok', $ownership->check(self::UUID)); // token two: looked up again
        $ownership->forget(self::UUID);
        self::assertSame('ok', $ownership->check(self::UUID)); // forgotten: looked up again
    }

    public function testAWebhookOrAdminChangeDropsTheVerdict(): void
    {
        $client = $this->prophesize(VideoOptimizerClient::class);
        $client->getVideo(self::UUID)->willReturn(['status' => 'ready', 'library_id' => self::LIBRARY])->shouldBeCalledTimes(2);
        $cache = new ArrayAdapter();
        $ownership = new VideoOwnership($client->reveal(), $cache);
        $resolver = new \Scale\VideoOptimizerBundle\Service\VideoOptimizerEmbedResolver($client->reveal(), $cache, null, null, $ownership);

        $ownership->check(self::UUID);
        $resolver->forget(self::UUID); // what the webhook and the admin proxy call
        $ownership->check(self::UUID);
    }

    public function testUnavailableAndNotReadyVideosMarkThePageNoindex(): void
    {
        foreach ([new VideoOptimizerException('down', 503), ['status' => 'processing', 'library_id' => self::LIBRARY]] as $answer) {
            $client = $this->prophesize(VideoOptimizerClient::class);
            $call = $client->getVideo(self::UUID);
            $answer instanceof \Throwable ? $call->willThrow($answer) : $call->willReturn($answer);
            $state = new EmbedRenderState();

            (new VideoOwnership($client->reveal(), new ArrayAdapter(), $state))->check(self::UUID);

            self::assertTrue($state->isNoIndex());
        }
    }

    public function testAMissingVideoDoesNotMarkNoindex(): void
    {
        $client = $this->prophesize(VideoOptimizerClient::class);
        $client->getVideo(self::UUID)->willThrow(new VideoOptimizerException('nope', 404));
        $state = new EmbedRenderState();

        (new VideoOwnership($client->reveal(), new ArrayAdapter(), $state))->check(self::UUID);

        self::assertFalse($state->isNoIndex());
    }

    public function testListedReadyVideosAreRememberedSoTheDetailLinkCostsNoLookup(): void
    {
        $client = $this->prophesize(VideoOptimizerClient::class);
        $client->getVideo(\Prophecy\Argument::any())->shouldNotBeCalled();
        $cache = new ArrayAdapter();
        $ownership = new VideoOwnership($client->reveal(), $cache);
        $ownership->remember(self::UUID, strtoupper(self::LIBRARY));

        self::assertSame('ok', $ownership->check(self::UUID));
        self::assertSame('ok', $ownership->check(self::UUID, self::LIBRARY));
        self::assertSame('missing', $ownership->check(self::UUID, '99999999-2222-4333-8444-555555555555'));
        $ownership->remember('not-a-uuid', null); // ignored
    }

    public function testTheListProviderSeedsTheVerdictsOfReadyVideosOnly(): void
    {
        $other = '33333333-2222-4333-8444-555555555555';
        $api = $this->prophesize(VideoOptimizerClient::class);
        $api->listVideosPage(\Prophecy\Argument::cetera())->willReturn(['videos' => [
            ['uuid' => self::UUID, 'status' => 'ready', 'library_id' => self::LIBRARY],
            ['uuid' => $other, 'status' => 'processing', 'library_id' => self::LIBRARY],
        ], 'next_cursor' => null, 'has_more' => false]);
        $ownership = $this->prophesize(VideoOwnership::class);
        $ownership->remember(self::UUID, self::LIBRARY)->shouldBeCalledTimes(1);
        $ownership->remember($other, \Prophecy\Argument::any())->shouldNotBeCalled();

        (new \Scale\VideoOptimizerBundle\Service\VideoListProvider($api->reveal(), new ArrayAdapter(), null, $ownership->reveal()))->page(null, null, null);
    }

    public function testTheLibraryOfTheBlockMustContainTheVideo(): void
    {
        $client = $this->prophesize(VideoOptimizerClient::class);
        $client->getVideo(self::UUID)->willReturn(['status' => 'ready', 'library_id' => self::LIBRARY])->shouldBeCalledTimes(1);
        $ownership = new VideoOwnership($client->reveal(), new ArrayAdapter());

        self::assertSame('ok', $ownership->check(self::UUID, strtoupper(self::LIBRARY)));
        self::assertSame('missing', $ownership->check(self::UUID, '99999999-2222-4333-8444-555555555555'));
        self::assertSame('missing', $ownership->check(self::UUID, 'typo'), 'A mistyped library never widens the check.');
    }

    public function testAnInvalidUuidNeverReachesTheApi(): void
    {
        $client = $this->prophesize(VideoOptimizerClient::class);
        $client->getVideo(\Prophecy\Argument::any())->shouldNotBeCalled();

        self::assertSame('missing', (new VideoOwnership($client->reveal(), new ArrayAdapter()))->check('../../x'));
    }

    public function testAnOutageIsUnavailableNotCachedAndDegradesThePage(): void
    {
        $client = $this->prophesize(VideoOptimizerClient::class);
        $client->getVideo(self::UUID)->willThrow(new VideoOptimizerException('down', 503))->shouldBeCalledTimes(2);
        $state = new EmbedRenderState();
        $ownership = new VideoOwnership($client->reveal(), new ArrayAdapter(), $state);

        self::assertSame('unavailable', $ownership->check(self::UUID));
        self::assertSame('unavailable', $ownership->check(self::UUID));
        self::assertTrue($state->isDegraded());
    }

    public function testAQueryDrivenLookupNeverTripsTheEmbedFailFastFlag(): void
    {
        // The flag of VideoOptimizerEmbedResolver would blank every video of the site for a minute: a visitor
        // must not be able to set it with a crafted ?vo_video= or ?vo_cursor=.
        $cache = new ArrayAdapter();
        $client = $this->prophesize(VideoOptimizerClient::class);
        $client->getVideo(self::UUID)->willThrow(new VideoOptimizerException('down', 503));
        $client->listVideosPage(\Prophecy\Argument::cetera())->willThrow(new VideoOptimizerException('rate limit', 429));

        (new VideoOwnership($client->reveal(), $cache))->check(self::UUID);
        (new \Scale\VideoOptimizerBundle\Service\VideoListProvider($client->reveal(), $cache))->page(null, null, 'abc');

        self::assertFalse($cache->hasItem('vo_embed_api_down'));
    }

    public function testRejectedTokensAreUnavailableToo(): void
    {
        $client = $this->prophesize(VideoOptimizerClient::class);
        $client->getVideo(self::UUID)->willThrow(new VideoOptimizerException('forbidden', 403));

        self::assertSame('unavailable', (new VideoOwnership($client->reveal(), new ArrayAdapter()))->check(self::UUID));
    }

    public function testUncachedLookupsAreLimitedSiteWide(): void
    {
        $calls = 0;
        $client = $this->prophesize(VideoOptimizerClient::class);
        $client->getVideo(\Prophecy\Argument::any())->will(function () use (&$calls): array {
            ++$calls;
            throw new VideoOptimizerException('not found', 404);
        });
        $ownership = new VideoOwnership($client->reveal(), new ArrayAdapter());

        $results = [];
        for ($i = 0; $i < VideoOwnership::MAX_NEW_PER_MINUTE + 5; ++$i) {
            $results[] = $ownership->check(sprintf('00000000-0000-4000-8000-%012d', $i));
        }

        self::assertSame(30, VideoOwnership::MAX_NEW_PER_MINUTE);
        self::assertSame(VideoOwnership::MAX_NEW_PER_MINUTE, $calls);
        self::assertSame(['missing'], array_values(array_unique(array_slice($results, 0, VideoOwnership::MAX_NEW_PER_MINUTE))));
        self::assertSame(['unavailable'], array_values(array_unique(array_slice($results, VideoOwnership::MAX_NEW_PER_MINUTE))), 'Beyond the budget: no API call, and not a cacheable "missing".');
    }

    public function testCachedVerdictsDoNotUseTheBudget(): void
    {
        $client = $this->prophesize(VideoOptimizerClient::class);
        $client->getVideo(self::UUID)->willReturn(['status' => 'ready', 'library_id' => self::LIBRARY]);
        $ownership = new VideoOwnership($client->reveal(), new ArrayAdapter());

        for ($i = 0; $i < 100; ++$i) {
            self::assertSame('ok', $ownership->check(self::UUID));
        }
    }
}
