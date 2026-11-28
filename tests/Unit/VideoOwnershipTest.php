<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Prophecy\PhpUnit\ProphecyTrait;
use Scale\VideoOptimizerBundle\Api\VideoOptimizerClient;
use Scale\VideoOptimizerBundle\Api\VideoOptimizerException;
use Scale\VideoOptimizerBundle\Service\EmbedRenderState;
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

    public function testAVideoThatIsNotReadyIsNotShown(): void
    {
        $client = $this->prophesize(VideoOptimizerClient::class);
        $client->getVideo(self::UUID)->willReturn(['status' => 'processing', 'library_id' => self::LIBRARY]);

        self::assertSame('missing', (new VideoOwnership($client->reveal(), new ArrayAdapter()))->check(self::UUID));
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
        self::assertSame(['missing'], array_values(array_unique($results)));
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
