<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\EventListener;

use Scale\VideoOptimizerBundle\Service\EmbedRenderState;
use Symfony\Component\HttpKernel\Event\ResponseEvent;

/**
 * Caps the HTTP cache lifetime of a page that shows short-lived data: a video list (VideoListProvider::TTL) or,
 * at 60 s, a degraded embed. Keeps a page rendered while a video embed was degraded (API failure, video without sources yet)
 * from sitting in the HTTP cache for the template's full cache lifetime: caps the shared and
 * private max-age and the reverse-proxy TTL Sulu sets (X-Reverse-Proxy-TTL) at 60 s, matching the
 * negative cache of VideoOptimizerEmbedResolver. Only ever shortens lifetimes that are set.
 */
class EmbedPageCacheListener
{
    public const MAX_TTL = 60;

    private const REVERSE_PROXY_TTL_HEADER = 'X-Reverse-Proxy-TTL';

    public function __construct(private EmbedRenderState $state)
    {
    }

    public function onKernelResponse(ResponseEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        if ($this->state->isNoIndex()) {
            $event->getResponse()->headers->set('X-Robots-Tag', 'noindex');
        }

        $max = $this->state->maxLifetime();
        if ($this->state->isDegraded()) {
            $max = null === $max ? self::MAX_TTL : min($max, self::MAX_TTL);
        }
        $this->state->reset();
        if (null === $max) {
            return;
        }

        $headers = $event->getResponse()->headers;
        foreach (['s-maxage', 'max-age'] as $directive) {
            $value = $headers->getCacheControlDirective($directive);
            if (is_numeric($value) && (int) $value > $max) {
                $headers->addCacheControlDirective($directive, (string) $max);
            }
        }

        $ttl = $headers->get(self::REVERSE_PROXY_TTL_HEADER);
        if (is_numeric($ttl) && (int) $ttl > $max) {
            $headers->set(self::REVERSE_PROXY_TTL_HEADER, (string) $max);
        }
    }
}
