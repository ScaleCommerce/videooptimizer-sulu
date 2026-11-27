<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Signing secret of the VideoOptimizer webhook, encrypted like the API token. A table of its own (a
 * single row, id = 1) so that existing installations keep working until `scale:videooptimizer:install`
 * has created it: only the webhook feature touches it.
 */
#[ORM\Entity]
#[ORM\Table(name: 'vo_webhook')]
class VideoOptimizerWebhook
{
    public const SINGLETON_ID = 1;

    #[ORM\Id]
    #[ORM\Column(type: 'integer')]
    private int $id = self::SINGLETON_ID;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $encryptedSecret = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    public function getId(): int
    {
        return $this->id;
    }

    public function getEncryptedSecret(): ?string
    {
        return $this->encryptedSecret;
    }

    public function setEncryptedSecret(?string $encryptedSecret): void
    {
        $this->encryptedSecret = $encryptedSecret;
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
