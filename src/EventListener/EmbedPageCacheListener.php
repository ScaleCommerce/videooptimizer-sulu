<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\EventListener;

use Scale\VideoOptimizerBundle\Service\EmbedRenderState;
use Symfony\Component\HttpKernel\Event\ResponseEvent;

/**
 * Keeps a page rendered while a video embed was degraded (API failure, video without sources yet)
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

        $degraded = $this->state->isDegraded();
        $this->state->reset();
        if (!$degraded) {
            return;
        }

        $headers = $event->getResponse()->headers;
        foreach (['s-maxage', 'max-age'] as $directive) {
            $value = $headers->getCacheControlDirective($directive);
            if (is_numeric($value) && (int) $value > self::MAX_TTL) {
                $headers->addCacheControlDirective($directive, (string) self::MAX_TTL);
            }
        }

        $ttl = $headers->get(self::REVERSE_PROXY_TTL_HEADER);
        if (is_numeric($ttl) && (int) $ttl > self::MAX_TTL) {
            $headers->set(self::REVERSE_PROXY_TTL_HEADER, (string) self::MAX_TTL);
        }
    }
}
