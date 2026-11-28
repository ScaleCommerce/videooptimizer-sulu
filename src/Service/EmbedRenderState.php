<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Service;

use Symfony\Contracts\Service\ResetInterface;

/**
 * Request-scoped flag: an embed lookup failed or returned a video without playable sources while
 * the page was rendered. The page must then not stay in the HTTP cache for its full lifetime
 * (see EmbedPageCacheListener).
 */
class EmbedRenderState implements ResetInterface
{
    private bool $degraded = false;

    private ?int $maxLifetime = null;
    private bool $noIndex = false;

    /**
     * The page shows a temporary state (e.g. a video that is unavailable right now): search engines must not index it.
     */
    public function markNoIndex(): void
    {
        $this->noIndex = true;
    }

    public function isNoIndex(): bool
    {
        return $this->noIndex;
    }


    /**
     * The page shows data cached for `$seconds` (e.g. a video list): its HTTP cache lifetime may not exceed that.
     */
    public function capLifetime(int $seconds): void
    {
        $this->maxLifetime = null === $this->maxLifetime ? $seconds : min($this->maxLifetime, $seconds);
    }

    public function maxLifetime(): ?int
    {
        return $this->maxLifetime;
    }

    public function markDegraded(): void
    {
        $this->degraded = true;
    }

    public function isDegraded(): bool
    {
        return $this->degraded;
    }

    public function reset(): void
    {
        $this->degraded = false;
        $this->maxLifetime = null;
        $this->noIndex = false;
    }
}
