<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Organization-wide VideoOptimizer configuration. A single row (id = 1) holds the
 * encrypted API token so editors never need to authenticate against VideoOptimizer.
 */
#[ORM\Entity]
#[ORM\Table(name: 'vo_settings')]
class VideoOptimizerSettings
{
    public const SINGLETON_ID = 1;

    #[ORM\Id]
    #[ORM\Column(type: 'integer')]
    private int $id = self::SINGLETON_ID;

    /**
     * Encrypted API token (never stored or returned in plain text).
     */
    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $encryptedToken = null;

    #[ORM\Column(type: 'string', length: 64, nullable: true)]
    private ?string $defaultLibraryId = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    public function getId(): int
    {
        return $this->id;
    }

    public function getEncryptedToken(): ?string
    {
        return $this->encryptedToken;
    }

    public function setEncryptedToken(?string $encryptedToken): void
    {
        $this->encryptedToken = $encryptedToken;
    }

    public function getDefaultLibraryId(): ?string
    {
        return $this->defaultLibraryId;
    }

    public function setDefaultLibraryId(?string $defaultLibraryId): void
    {
        $this->defaultLibraryId = $defaultLibraryId;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(?\DateTimeImmutable $updatedAt): void
    {
        $this->updatedAt = $updatedAt;
    }
}
