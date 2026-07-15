<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Service;

use Doctrine\ORM\EntityManagerInterface;
use Scale\VideoOptimizerBundle\Entity\VideoOptimizerSettings;
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
     * Persists a new token (if provided) and the default library.
     * An empty/null token leaves the existing token untouched.
     */
    public function save(?string $plainToken, ?string $defaultLibraryId): void
    {
        $settings = $this->getSettings();

        if (null !== $plainToken && '' !== trim($plainToken)) {
            $settings->setEncryptedToken($this->cipher->encrypt(trim($plainToken)));
        }

        $settings->setDefaultLibraryId($defaultLibraryId ?: null);
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
}
