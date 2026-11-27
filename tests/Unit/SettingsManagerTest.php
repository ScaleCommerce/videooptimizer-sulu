<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Tests\Unit;

use Doctrine\DBAL\Exception\TableNotFoundException;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Prophecy\Argument;
use Prophecy\PhpUnit\ProphecyTrait;
use Scale\VideoOptimizerBundle\Entity\VideoOptimizerSettings;
use Scale\VideoOptimizerBundle\Entity\VideoOptimizerWebhook;
use Scale\VideoOptimizerBundle\Security\TokenCipher;
use Scale\VideoOptimizerBundle\Service\SettingsManager;

class SettingsManagerTest extends TestCase
{
    use ProphecyTrait;

    private TokenCipher $cipher;

    protected function setUp(): void
    {
        $this->cipher = new TokenCipher('test-secret');
    }

    public function testReadsAndDecryptsTheStoredToken(): void
    {
        $settings = new VideoOptimizerSettings();
        $settings->setEncryptedToken($this->cipher->encrypt('vp_secret'));

        $manager = $this->manager($settings);

        self::assertTrue($manager->isConfigured());
        self::assertSame('vp_secret', $manager->getApiToken());
    }

    public function testUnconfiguredWhenNoRowExists(): void
    {
        $manager = $this->manager(null);

        self::assertFalse($manager->isConfigured());
        self::assertNull($manager->getApiToken());
        self::assertSame('hosted', $manager->getDefaultPlayer(), 'default player falls back to hosted');
    }

    public function testSaveEncryptsTheTokenAndPersists(): void
    {
        $settings = new VideoOptimizerSettings();
        $manager = $this->manager($settings, persistExpected: true);

        $manager->save('vp_new', 'lib-9', 'native');

        self::assertSame('vp_new', $this->cipher->decrypt((string) $settings->getEncryptedToken()));
        self::assertSame('lib-9', $settings->getDefaultLibraryId());
        self::assertSame('native', $settings->getDefaultPlayer());
    }

    public function testSaveWithEmptyTokenKeepsTheExistingOne(): void
    {
        $settings = new VideoOptimizerSettings();
        $settings->setEncryptedToken($this->cipher->encrypt('vp_keep'));
        $manager = $this->manager($settings, persistExpected: true);

        $manager->save('   ', null, null);

        self::assertSame('vp_keep', $this->cipher->decrypt((string) $settings->getEncryptedToken()));
    }

    public function testClearTokenRemovesIt(): void
    {
        $settings = new VideoOptimizerSettings();
        $settings->setEncryptedToken($this->cipher->encrypt('vp_bye'));
        $manager = $this->manager($settings, persistExpected: true);

        $manager->clearToken();

        self::assertNull($settings->getEncryptedToken());
    }

    public function testTheWebhookSecretIsStoredEncryptedAndReadBack(): void
    {
        $webhook = new VideoOptimizerWebhook();
        $entityManager = $this->prophesize(EntityManagerInterface::class);
        $entityManager->find(VideoOptimizerWebhook::class, VideoOptimizerWebhook::SINGLETON_ID)->willReturn($webhook);
        $entityManager->persist($webhook)->shouldBeCalled();
        $entityManager->flush()->shouldBeCalled();
        $manager = new SettingsManager($entityManager->reveal(), $this->cipher);

        self::assertFalse($manager->isWebhookConfigured());
        $manager->saveWebhookSecret('  whsec_123 ');

        self::assertNotSame('whsec_123', $webhook->getEncryptedSecret());
        self::assertSame('whsec_123', $manager->getWebhookSecret());
        self::assertTrue($manager->isWebhookConfigured());
    }

    public function testAnEmptyWebhookSecretKeepsTheStoredOneAndClearRemovesIt(): void
    {
        $webhook = new VideoOptimizerWebhook();
        $webhook->setEncryptedSecret($this->cipher->encrypt('whsec_keep'));
        $entityManager = $this->prophesize(EntityManagerInterface::class);
        $entityManager->find(VideoOptimizerWebhook::class, VideoOptimizerWebhook::SINGLETON_ID)->willReturn($webhook);
        $entityManager->persist($webhook)->shouldBeCalled();
        $entityManager->flush()->shouldBeCalled();
        $manager = new SettingsManager($entityManager->reveal(), $this->cipher);

        $manager->saveWebhookSecret('   ');
        self::assertSame('whsec_keep', $manager->getWebhookSecret());

        $manager->clearWebhookSecret();
        self::assertNull($manager->getWebhookSecret());
    }

    public function testWithoutTheWebhookTableTheSecretIsSimplyMissing(): void
    {
        $entityManager = $this->prophesize(EntityManagerInterface::class);
        $entityManager->find(VideoOptimizerWebhook::class, VideoOptimizerWebhook::SINGLETON_ID)->willThrow($this->tableNotFound());
        $manager = new SettingsManager($entityManager->reveal(), $this->cipher);

        self::assertNull($manager->getWebhookSecret());
        self::assertFalse($manager->isWebhookConfigured());
    }

    private function tableNotFound(): TableNotFoundException
    {
        $driver = new class('no such table') extends \Exception implements \Doctrine\DBAL\Driver\Exception {
            public function getSQLState(): ?string
            {
                return '42S02';
            }
        };

        return new TableNotFoundException($driver, null);
    }

    private function manager(?VideoOptimizerSettings $settings, bool $persistExpected = false): SettingsManager
    {
        $entityManager = $this->prophesize(EntityManagerInterface::class);
        $entityManager->find(VideoOptimizerSettings::class, VideoOptimizerSettings::SINGLETON_ID)->willReturn($settings);

        if ($persistExpected) {
            $entityManager->persist(Argument::type(VideoOptimizerSettings::class))->shouldBeCalled();
            $entityManager->flush()->shouldBeCalled();
        }

        return new SettingsManager($entityManager->reveal(), $this->cipher);
    }
}
