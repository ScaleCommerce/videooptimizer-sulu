<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Service;

use Doctrine\DBAL\Exception\TableNotFoundException;
use Doctrine\ORM\EntityManagerInterface;
use Scale\VideoOptimizerBundle\Entity\VideoOptimizerSettings;
use Scale\VideoOptimizerBundle\Entity\VideoOptimizerWebhook;
use Scale\VideoOptimizerBundle\Security\TokenCipher;

/**
 * Central access point for the organization-wide VideoOptimizer settings.
 */
class SettingsManager
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private TokenCipher $cipher,
    ) {
    }

    public function getSettings(): VideoOptimizerSettings
    {
        $settings = $this->entityManager->find(VideoOptimizerSettings::class, VideoOptimizerSettings::SINGLETON_ID);

        return $settings ?? new VideoOptimizerSettings();
    }

    public function isConfigured(): bool
    {
        return null !== $this->getApiToken();
    }

    public function getApiToken(): ?string
    {
        $encrypted = $this->getSettings()->getEncryptedToken();
        if (null === $encrypted) {
            return null;
        }

        return $this->cipher->decrypt($encrypted);
    }

    public function getDefaultLibraryId(): ?string
    {
        return $this->getSettings()->getDefaultLibraryId();
    }

    /**
     * The organization-wide default player. Falls back to 'hosted' when nothing is configured yet.
     */
    public function getDefaultPlayer(): string
    {
        $defaultPlayer = $this->getSettings()->getDefaultPlayer();

        return null !== $defaultPlayer && '' !== $defaultPlayer ? $defaultPlayer : 'hosted';
    }

    /**
     * Persists a new token (if provided), the default library, and the default player.
     * An empty/null token leaves the existing token untouched.
     */
    public function save(?string $plainToken, ?string $defaultLibraryId, ?string $defaultPlayer = null): void
    {
        $settings = $this->getSettings();

        if (null !== $plainToken && '' !== trim($plainToken)) {
            $settings->setEncryptedToken($this->cipher->encrypt(trim($plainToken)));
        }

        $settings->setDefaultLibraryId($defaultLibraryId ?: null);
        $settings->setDefaultPlayer($defaultPlayer ?: null);
        $settings->setUpdatedAt(new \DateTimeImmutable());

        $this->entityManager->persist($settings);
        $this->entityManager->flush();
    }

    public function clearToken(): void
    {
        $settings = $this->getSettings();
        $settings->setEncryptedToken(null);
        $settings->setUpdatedAt(new \DateTimeImmutable());
        $this->entityManager->persist($settings);
        $this->entityManager->flush();
    }

    /**
     * The webhook signing secret, or null when none is stored. Also null while the `vo_webhook` table does not
     * exist yet (an upgrade that did not re-run `scale:videooptimizer:install`): everything else keeps working.
     */
    public function getWebhookSecret(): ?string
    {
        try {
            $encrypted = $this->entityManager->find(VideoOptimizerWebhook::class, VideoOptimizerWebhook::SINGLETON_ID)?->getEncryptedSecret();
        } catch (TableNotFoundException) {
            return null;
        }

        return null === $encrypted ? null : $this->cipher->decrypt($encrypted);
    }

    public function isWebhookConfigured(): bool
    {
        return null !== $this->getWebhookSecret();
    }

    /**
     * Stores a new webhook secret; an empty value leaves the stored one untouched.
     *
     * @throws TableNotFoundException when the `vo_webhook` table has not been created yet
     */
    public function saveWebhookSecret(string $plainSecret): void
    {
        if ('' === trim($plainSecret)) {
            return;
        }

        $webhook = $this->entityManager->find(VideoOptimizerWebhook::class, VideoOptimizerWebhook::SINGLETON_ID) ?? new VideoOptimizerWebhook();
        $webhook->setEncryptedSecret($this->cipher->encrypt(trim($plainSecret)));
        $webhook->setUpdatedAt(new \DateTimeImmutable());
        $this->entityManager->persist($webhook);
        $this->entityManager->flush();
    }

    public function clearWebhookSecret(): void
    {
        try {
            $webhook = $this->entityManager->find(VideoOptimizerWebhook::class, VideoOptimizerWebhook::SINGLETON_ID);
        } catch (TableNotFoundException) {
            return;
        }
        if (null === $webhook) {
            return;
        }
        $webhook->setEncryptedSecret(null);
        $webhook->setUpdatedAt(new \DateTimeImmutable());
        $this->entityManager->persist($webhook);
        $this->entityManager->flush();
    }
}
