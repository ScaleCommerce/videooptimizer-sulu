<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\EventListener;

use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Twig\Environment;

/**
 * Injects the VideoOptimizer frontend assets into pages that render a VideoOptimizer surface, so
 * consumers don't have to wire the CSS/JS into their templates. This mirrors how Symfony's own
 * WebDebugToolbarListener injects markup into the finished response.
 *
 * The bundle's frontend Twig (blocks and the video_optimizer_* functions) emit an invisible
 * SENTINEL comment once per rendered surface. When this listener finds it in a text/html response,
 * it inserts the stylesheet before </head>, the deferred script before </body> (for performance),
 * and strips the sentinel. Pages without a VideoOptimizer surface never carry the sentinel and stay
 * untouched. Disable via `scale_video_optimizer.auto_inject_assets: false` and use the partial.
 */
final class AssetInjectionListener
{
    /** Emitted by the frontend Twig; its presence gates injection and is removed afterwards. */
    public const SENTINEL = '<!--vo-assets-->';

    /** If the response already references this, the consumer loaded the assets manually — don't double up. */
    private const ASSET_PRESENT_MARKER = 'scalevideooptimizer/js/vo-blocks.js';

    private const CSS_TEMPLATE = '@ScaleVideoOptimizer/partials/_assets_css.html.twig';
    private const JS_TEMPLATE = '@ScaleVideoOptimizer/partials/_assets_js.html.twig';

    public function __construct(
        private readonly Environment $twig,
        private readonly bool $enabled,
    ) {
    }

    public function onKernelResponse(ResponseEvent $event): void
    {
        if (!$this->enabled || !$event->isMainRequest()) {
            return;
        }

        $response = $event->getResponse();
        // HTML responses often carry no explicit Content-Type yet at kernel.response time (it is set
        // later in Response::prepare()), so treat "unset" as HTML and only bail on an explicit
        // non-HTML type such as application/json. The sentinel below is the real gate.
        $contentType = (string) $response->headers->get('Content-Type', '');
        if ('' !== $contentType && !str_contains($contentType, 'text/html')) {
            return;
        }

        $content = $response->getContent();
        if (!\is_string($content) || !str_contains($content, self::SENTINEL)) {
            return;
        }

        $css = trim($this->twig->render(self::CSS_TEMPLATE));
        $js = trim($this->twig->render(self::JS_TEMPLATE));

        $injected = self::inject($content, $css, $js);
        if (null !== $injected) {
            $response->setContent($injected);
        }
    }

    /**
     * Places the asset tags in $html and removes the sentinel. Returns the modified HTML, or null
     * when there is nothing to do (no sentinel, or no </head>/</body> to inject into).
     */
    public static function inject(string $html, string $cssTag, string $jsTag): ?string
    {
        if (!str_contains($html, self::SENTINEL)) {
            return null;
        }

        // Assets already on the page (manual partial). Strip the sentinel so it never leaks, but
        // don't add a second copy of the tags.
        if (str_contains($html, self::ASSET_PRESENT_MARKER)) {
            return str_replace(self::SENTINEL, '', $html);
        }

        $headPos = stripos($html, '</head>');
        $bodyPos = strripos($html, '</body>');
        if (false === $headPos || false === $bodyPos) {
            return null;
        }

        // Insert the later position (</body>) first so the earlier offset (</head>) stays valid.
        $html = substr($html, 0, $bodyPos) . $jsTag . substr($html, $bodyPos);
        $html = substr($html, 0, $headPos) . $cssTag . substr($html, $headPos);

        return str_replace(self::SENTINEL, '', $html);
    }
}
