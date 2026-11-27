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
    }
}
