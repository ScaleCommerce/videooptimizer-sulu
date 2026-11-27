<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Tests\Unit;

use Doctrine\DBAL\Exception\TableNotFoundException;
use PHPUnit\Framework\TestCase;
use Prophecy\Argument;
use Prophecy\PhpUnit\ProphecyTrait;
use Scale\VideoOptimizerBundle\Api\VideoOptimizerClient;
use Scale\VideoOptimizerBundle\Controller\Admin\SettingsController;
use Scale\VideoOptimizerBundle\Controller\WebhookController;
use Scale\VideoOptimizerBundle\Service\SettingsManager;
use Symfony\Component\Cache\Adapter\ArrayAdapter;
use Symfony\Component\HttpFoundation\Request;

class SettingsControllerTest extends TestCase
{
    use ProphecyTrait;

    public function testSettingsExposeTheWebhookStateButNeverTheSecret(): void
    {
        $cache = new ArrayAdapter();
        $cache->get(WebhookController::LAST_DELIVERY_KEY, static fn (): array => ['event' => 'video.ready', 'time' => 1700000000]);
        $settings = $this->settings(webhookConfigured: true);

        $data = json_decode((string) $this->controller($settings, $cache)->get(Request::create('https://cms.example.com/admin/api/videooptimizer/settings'))->getContent(), true);

        self::assertTrue($data['webhookConfigured']);
        self::assertSame('https://cms.example.com/_videooptimizer/webhook', $data['webhookUrl']);
        self::assertSame(['event' => 'video.ready', 'time' => 1700000000], $data['webhookLastDelivery']);
        self::assertStringNotContainsString('whsec', (string) json_encode($data));
    }

    public function testSettingsWithoutAnyDeliveryYet(): void
    {
        $data = json_decode((string) $this->controller($this->settings())->get(Request::create('https://cms.example.com/'))->getContent(), true);

        self::assertFalse($data['webhookConfigured']);
        self::assertNull($data['webhookLastDelivery']);
    }

    public function testPutStoresAWebhookSecret(): void
    {
        $settings = $this->settings();
        $settings->saveWebhookSecret('whsec_new')->shouldBeCalled();
        $settings->save(null, null, null)->shouldBeCalled();

        $response = $this->controller($settings)->put(new Request(content: '{"webhookSecret":"whsec_new"}'));

        self::assertSame(200, $response->getStatusCode());
    }

    public function testPutWithoutASecretDoesNotTouchTheWebhook(): void
    {
        $settings = $this->settings();
        $settings->saveWebhookSecret(Argument::any())->shouldNotBeCalled();
        $settings->save(null, null, null)->shouldBeCalled();

        $this->controller($settings)->put(new Request(content: '{}'));
    }

    public function testMissingWebhookTableIsExplained(): void
    {
        $driver = new class('x') extends \Exception implements \Doctrine\DBAL\Driver\Exception {
            public function getSQLState(): ?string
            {
                return '42S02';
            }
        };
        $settings = $this->settings();
        $settings->save(Argument::cetera())->shouldBeCalled();
        $settings->saveWebhookSecret('whsec_new')->willThrow(new TableNotFoundException($driver, null));

        $response = $this->controller($settings)->put(new Request(content: '{"webhookSecret":"whsec_new"}'));

        self::assertSame(409, $response->getStatusCode());
        $body = json_decode((string) $response->getContent(), true);
        self::assertSame('webhook_table_missing', $body['code']);
        self::assertStringContainsString('scale:videooptimizer:install', $body['message']);
    }

    public function testTheWebhookSecretCanBeRemoved(): void
    {
        $settings = $this->settings();
        $settings->clearWebhookSecret()->shouldBeCalled();

        self::assertSame(200, $this->controller($settings)->deleteWebhookSecret(Request::create('https://cms.example.com/'))->getStatusCode());
    }

    /**
     * @return \Prophecy\Prophecy\ObjectProphecy<SettingsManager>
     */
    private function settings(bool $webhookConfigured = false): \Prophecy\Prophecy\ObjectProphecy
    {
        $settings = $this->prophesize(SettingsManager::class);
        $settings->isConfigured()->willReturn(true);
        $settings->getDefaultLibraryId()->willReturn(null);
        $settings->getDefaultPlayer()->willReturn('hosted');
        $settings->isWebhookConfigured()->willReturn($webhookConfigured);

        return $settings;
    }

    /**
     * @param \Prophecy\Prophecy\ObjectProphecy<SettingsManager> $settings
     */
    private function controller(\Prophecy\Prophecy\ObjectProphecy $settings, ?ArrayAdapter $cache = null): SettingsController
    {
        return new SettingsController($settings->reveal(), $this->prophesize(VideoOptimizerClient::class)->reveal(), $cache ?? new ArrayAdapter());
    }
}
