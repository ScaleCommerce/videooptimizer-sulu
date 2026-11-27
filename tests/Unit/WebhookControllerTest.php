<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Prophecy\Argument;
use Prophecy\PhpUnit\ProphecyTrait;
use Psr\Log\LoggerInterface;
use Scale\VideoOptimizerBundle\Controller\WebhookController;
use Scale\VideoOptimizerBundle\Service\SettingsManager;
use Scale\VideoOptimizerBundle\Service\VideoOptimizerEmbedResolver;
use Sulu\Bundle\HttpCacheBundle\Cache\CacheManagerInterface;
use Symfony\Component\Cache\Adapter\ArrayAdapter;
use Symfony\Component\HttpFoundation\Request;

class WebhookControllerTest extends TestCase
{
    use ProphecyTrait;

    private const SECRET = 'whsec_test';
    private const UUID = '5c0a1e6e-7d3b-4c2a-9f10-0000000000de';

    private ArrayAdapter $cache;

    /** @var list<string> */
    private array $forgotten = [];

    /** @var list<string> */
    private array $invalidated = [];

    protected function setUp(): void
    {
        $this->cache = new ArrayAdapter();
    }

    public function testVerifyAcceptsAValidSignatureInsideTheReplayWindow(): void
    {
        $body = '{"event":"video.ready"}';
        $signature = $this->sign('1700000000', $body);

        self::assertTrue(WebhookController::verify(self::SECRET, '1700000000', $body, $signature, 1700000000));
        self::assertTrue(WebhookController::verify(self::SECRET, '1700000000', $body, $signature, 1700000299));
        self::assertTrue(WebhookController::verify(self::SECRET, '1700000000', $body, $signature, 1699999701));
    }

    public function testVerifyRejectsBadSignaturesOldTimestampsAndEmptySecrets(): void
    {
        $body = '{"event":"video.ready"}';
        $signature = $this->sign('1700000000', $body);

        self::assertFalse(WebhookController::verify(self::SECRET, '1700000000', $body, $signature, 1700000301), 'replayed after the window');
        self::assertFalse(WebhookController::verify(self::SECRET, '1700000000', $body . ' ', $signature, 1700000000), 'tampered body');
        self::assertFalse(WebhookController::verify('other', '1700000000', $body, $signature, 1700000000), 'wrong secret');
        self::assertFalse(WebhookController::verify('', '1700000000', $body, $this->sign('1700000000', $body, ''), 1700000000), 'no secret');
        self::assertFalse(WebhookController::verify(self::SECRET, 'abc', $body, $signature, 1700000000), 'non numeric timestamp');
        self::assertFalse(WebhookController::verify(self::SECRET, '1700000000', $body, 'sha256=', 1700000000));
    }

    public function testAnUnconfiguredSecretFailsClosed(): void
    {
        $response = $this->controller(null)($this->request('{}', ['signed' => false]));

        self::assertSame(503, $response->getStatusCode());
        self::assertStringContainsString('no-store', (string) $response->headers->get('Cache-Control'));
    }

    public function testRejectsAnInvalidSignature(): void
    {
        $request = $this->request('{"event":"video.ready"}', ['signature' => 'sha256=deadbeef']);

        self::assertSame(401, $this->controller()($request)->getStatusCode());
        self::assertSame([], $this->forgotten);
    }

    public function testRejectsAStaleTimestamp(): void
    {
        $request = $this->request('{"event":"video.ready","data":{"uuid":"' . self::UUID . '"}}', ['timestamp' => (string) (time() - 600)]);

        self::assertSame(401, $this->controller()($request)->getStatusCode());
    }

    public function testRejectsAnOversizedContentLengthWithoutReadingTheBody(): void
    {
        $request = new class([], [], [], [], [], ['CONTENT_LENGTH' => '1048577']) extends Request {
            public function getContent(bool $asResource = false): string
            {
                throw new \LogicException('The body must not be read.');
            }
        };

        self::assertSame(413, $this->controller()($request)->getStatusCode());
    }

    public function testAReplayedSignatureDoesNotClaimTheDeliveryId(): void
    {
        $controller = $this->controller();
        $body = '{"event":"webhook.test"}';
        $timestamp = (string) time();

        $controller($this->request($body, ['timestamp' => $timestamp, 'delivery' => 'first']));
        $controller($this->request($body, ['timestamp' => $timestamp, 'delivery' => 'second']));

        // 'second' was a replay of the signed request: its id must stay unclaimed.
        self::assertFalse($this->cache->hasItem('vo_wh_' . substr(md5('second'), 0, 32)));
    }

    public function testRejectsAnOversizedBodyBeforeVerifying(): void
    {
        $request = $this->request(str_repeat('a', 1048577), ['signed' => false]);

        self::assertSame(413, $this->controller()($request)->getStatusCode());
    }

    /**
     * @return iterable<string, array{string}>
     */
    public static function videoEvents(): iterable
    {
        yield 'ready' => ['video.ready'];
        yield 'failed' => ['video.failed'];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('videoEvents')]
    public function testVideoEventsDropTheEmbedCacheAndThePageCacheOfTheVideo(string $event): void
    {
        $response = $this->controller()($this->request(json_encode(['event' => $event, 'data' => ['uuid' => self::UUID]], JSON_THROW_ON_ERROR)));

        self::assertSame(200, $response->getStatusCode());
        self::assertSame(['received' => true, 'flushed' => true], json_decode((string) $response->getContent(), true));
        self::assertSame([self::UUID], $this->forgotten);
        self::assertSame([self::UUID], $this->invalidated);
        self::assertStringContainsString('no-store', (string) $response->headers->get('Cache-Control'));
    }

    public function testTheTestEventIsAcknowledgedWithoutInvalidating(): void
    {
        $response = $this->controller()($this->request('{"event":"webhook.test"}'));

        self::assertSame(['ok' => true], json_decode((string) $response->getContent(), true));
        self::assertSame([], $this->forgotten);
    }

    public function testUnknownEventsAndForeignIdsAreAcknowledgedButNotFlushed(): void
    {
        $unknown = $this->controller()($this->request('{"event":"video.updated","data":{"uuid":"' . self::UUID . '"}}'));
        $badId = $this->controller()($this->request('{"event":"video.ready","data":{"uuid":"../x"}}', ['delivery' => 'd2']));

        self::assertSame(['received' => true, 'flushed' => false], json_decode((string) $unknown->getContent(), true));
        self::assertSame(['received' => true, 'flushed' => false], json_decode((string) $badId->getContent(), true));
        self::assertSame([], $this->forgotten);
    }

    public function testARetriedDeliveryIsAcknowledgedOnlyOnce(): void
    {
        $controller = $this->controller();
        $body = json_encode(['event' => 'video.ready', 'data' => ['uuid' => self::UUID]], JSON_THROW_ON_ERROR);

        $first = $controller($this->request($body, ['delivery' => 'del_1']));
        $retry = $controller($this->request($body, ['delivery' => 'del_1']));

        self::assertSame(['received' => true, 'flushed' => true], json_decode((string) $first->getContent(), true));
        self::assertSame(['duplicate' => true], json_decode((string) $retry->getContent(), true));
        self::assertSame([self::UUID], $this->forgotten, 'processed once');
    }

    public function testAReplayedSignatureIsADuplicateEvenWithANewDeliveryId(): void
    {
        $controller = $this->controller();
        $body = json_encode(['event' => 'video.ready', 'data' => ['uuid' => self::UUID]], JSON_THROW_ON_ERROR);
        $timestamp = (string) time();

        $controller($this->request($body, ['timestamp' => $timestamp, 'delivery' => 'a']));
        $replay = $controller($this->request($body, ['timestamp' => $timestamp, 'delivery' => 'b']));

        self::assertSame(['duplicate' => true], json_decode((string) $replay->getContent(), true));
        self::assertCount(1, $this->forgotten);
    }

    public function testRemembersTheLastDeliveryForTheSettingsView(): void
    {
        $this->controller()($this->request('{"event":"video.ready","data":{"uuid":"' . self::UUID . '"}}'));

        $last = $this->cache->getItem(WebhookController::LAST_DELIVERY_KEY)->get();
        self::assertSame('video.ready', $last['event']);
        self::assertEqualsWithDelta(time(), $last['time'], 5);
    }

    public function testAFailingPageCacheInvalidationStillAnswersOk(): void
    {
        $cacheManager = $this->prophesize(CacheManagerInterface::class);
        $cacheManager->invalidateReference(Argument::cetera())->willThrow(new \RuntimeException('varnish down'));
        $logger = $this->prophesize(LoggerInterface::class);
        $logger->warning(Argument::cetera())->shouldBeCalled();
        $logger->info(Argument::cetera())->shouldBeCalled();

        $response = $this->controller(self::SECRET, $cacheManager->reveal(), $logger->reveal())($this->request('{"event":"video.ready","data":{"uuid":"' . self::UUID . '"}}'));

        self::assertSame(200, $response->getStatusCode());
        self::assertSame([self::UUID], $this->forgotten, 'the embed cache is dropped regardless');
    }

    private function controller(?string $secret = self::SECRET, ?CacheManagerInterface $cacheManager = null, ?LoggerInterface $logger = null): WebhookController
    {
        $settings = $this->prophesize(SettingsManager::class);
        $settings->getWebhookSecret()->willReturn($secret);

        $resolver = $this->prophesize(VideoOptimizerEmbedResolver::class);
        $forgotten = &$this->forgotten;
        $resolver->forget(Argument::type('string'))->will(function (array $args) use (&$forgotten): void {
            $forgotten[] = $args[0];
        });

        if (null === $cacheManager) {
            $invalidated = &$this->invalidated;
            $manager = $this->prophesize(CacheManagerInterface::class);
            $manager->invalidateReference('video_optimizer', Argument::type('string'))->will(function (array $args) use (&$invalidated): void {
                $invalidated[] = $args[1];
            });
            $cacheManager = $manager->reveal();
        }

        return new WebhookController($settings->reveal(), $resolver->reveal(), $this->cache, $cacheManager, $logger);
    }

    /**
     * @param array{signed?: bool, timestamp?: string, signature?: string, delivery?: string} $options
     */
    private function request(string $body, array $options = []): Request
    {
        $timestamp = $options['timestamp'] ?? (string) time();
        $server = ['HTTP_X_VIDEOOPTIMIZER_TIMESTAMP' => $timestamp];
        if (($options['signed'] ?? true)) {
            $server['HTTP_X_VIDEOOPTIMIZER_SIGNATURE'] = $options['signature'] ?? $this->sign($timestamp, $body);
        }
        if (isset($options['delivery'])) {
            $server['HTTP_X_VIDEOOPTIMIZER_DELIVERY_ID'] = $options['delivery'];
        }

        return new Request(server: $server, content: $body);
    }

    private function sign(string $timestamp, string $body, string $secret = self::SECRET): string
    {
        return 'sha256=' . hash_hmac('sha256', $timestamp . '.' . $body, $secret);
    }
}
