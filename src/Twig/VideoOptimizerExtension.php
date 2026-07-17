<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Twig;

use Scale\VideoOptimizerBundle\Service\SettingsManager;
use Scale\VideoOptimizerBundle\Service\VideoOptimizerEmbedResolver;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

/**
 * Renders a VideoOptimizer embed (hosted iframe player) from a stored video property.
 */
class VideoOptimizerExtension extends AbstractExtension
{
    /**
     * Cached organization-wide default player, resolved lazily so a page with several blocks
     * only triggers one settings lookup.
     */
    private ?string $cachedDefaultPlayer = null;

    public function __construct(
        private string $embedBaseUrl,
        private VideoOptimizerEmbedResolver $embedResolver,
        private SettingsManager $settingsManager,
    ) {
    }

    public function getFunctions(): array
    {
        return [
            new TwigFunction('video_optimizer_embed', [$this, 'renderEmbed'], ['is_safe' => ['html']]),
            new TwigFunction('video_optimizer_embed_url', [$this, 'embedUrl']),
            new TwigFunction('video_optimizer_background', [$this, 'renderBackground'], ['is_safe' => ['html']]),
            new TwigFunction('video_optimizer_dimensions', [$this, 'dimensions']),
            new TwigFunction('video_optimizer_schema', [$this, 'schema'], ['is_safe' => ['html']]),
            new TwigFunction('video_optimizer_player_options', [$this, 'playerOptions']),
            new TwigFunction('video_optimizer_player', [$this, 'player']),
            new TwigFunction('video_optimizer_srcset', [$this, 'srcset']),
            new TwigFunction('video_optimizer_native', [$this, 'renderNative'], ['is_safe' => ['html']]),
        ];
    }

    /**
     * Resolves the effective player for a block: its own 'player' field when it is an explicit
     * 'hosted'/'native' choice, otherwise the organization-wide default (itself 'hosted' unless
     * an admin configured 'native'). Any other value (notably the 'inherit' sentinel) falls back
     * to the default too.
     *
     * @param array<string, mixed>|null $block
     */
    public function player(?array $block): string
    {
        $value = $block['player'] ?? null;
        if ('hosted' === $value || 'native' === $value) {
            return $value;
        }

        return $this->cachedDefaultPlayer ??= $this->settingsManager->getDefaultPlayer();
    }

    /**
     * Reads the per-block player-option fields into an options map for embedUrl(). Click-to-play
     * surfaces (facade, lightbox) default to autoplay on unless the editor explicitly turned it off.
     *
     * @param array<string, mixed>|null $block
     *
     * @return array{autoplay: string, controls: string, loop: string, muted: string}
     */
    public function playerOptions(?array $block): array
    {
        $block ??= [];
        $autoplay = self::str($block['autoplay'] ?? 'inherit');

        return [
            'autoplay' => 'inherit' === $autoplay ? '1' : $autoplay,
            'controls' => self::str($block['controls'] ?? 'inherit'),
            'loop' => self::str($block['loop'] ?? 'inherit'),
            'muted' => self::str($block['muted'] ?? 'inherit'),
        ];
    }

    /**
     * Returns a responsive poster srcset for a video (from the cached embed lookup), or null.
     *
     * @param array<string, mixed>|null $video
     */
    public function srcset(?array $video): ?string
    {
        if (null === $video || empty($video['uuid'])) {
            return null;
        }

        return $this->embedResolver->getPosterSrcset(self::str($video['uuid']));
    }

    /**
     * Renders a schema.org VideoObject JSON-LD block for SEO/rich results. Metadata (poster,
     * duration) comes from the cached embed lookup; returns '' when there is no video.
     *
     * @param array<string, mixed>|null $video
     */
    public function schema(?array $video, ?string $name = null): string
    {
        if (null === $video || empty($video['uuid'])) {
            return '';
        }

        $sources = $this->embedResolver->getSources(self::str($video['uuid']));

        $data = ['@context' => 'https://schema.org', '@type' => 'VideoObject'];

        $name = $name ?? ($video['title'] ?? null);
        if (\is_string($name) && '' !== $name) {
            $data['name'] = $name;
        }

        $poster = $sources['poster'] ?? ($video['posterUrl'] ?? null);
        if (\is_string($poster) && '' !== $poster) {
            $data['thumbnailUrl'] = $poster;
        }

        $embedUrl = $this->embedUrl($video);
        if (null !== $embedUrl) {
            $data['embedUrl'] = $embedUrl;
        }

        $duration = VideoOptimizerEmbedResolver::isoDuration($sources['duration'] ?? null);
        if (null !== $duration) {
            $data['duration'] = $duration;
        }

        // JSON_HEX_TAG escapes < and > so a title containing "</script>" cannot break out of the tag
        // (angle brackets become </> regardless of slashes, so unescaped slashes stay safe).
        $json = json_encode($data, \JSON_HEX_TAG | \JSON_HEX_AMP | \JSON_UNESCAPED_SLASHES | \JSON_UNESCAPED_UNICODE);

        return '<script type="application/ld+json">' . $json . '</script>';
    }

    /**
     * Returns the pixel dimensions and orientation of a video so templates can size the frame
     * to the real aspect ratio instead of a fixed 16:9. Resolved (and cached) from the embed API.
     *
     * @param array<string, mixed>|null $video
     *
     * @return array{width: ?int, height: ?int, orientation: ?string}
     */
    public function dimensions(?array $video): array
    {
        if (null === $video || empty($video['uuid'])) {
            return ['width' => null, 'height' => null, 'orientation' => null];
        }

        return $this->embedResolver->getDimensions(self::str($video['uuid']));
    }

    /**
     * Builds a player embed URL. Only the allowlisted player params that are explicitly set
     * (not '' / null) are appended, so unset options fall back to the merged embed theme.
     *
     * @param array<string, mixed>|null  $video
     * @param array<string, string|int>  $options e.g. {autoplay: '1', controls: '0', loop: '1'}
     */
    public function embedUrl(?array $video, array $options = []): ?string
    {
        if (null === $video || empty($video['uuid'])) {
            return null;
        }

        $url = rtrim($this->embedBaseUrl, '/') . '/embed/' . rawurlencode(self::str($video['uuid']));

        // Only append boolean player params that are explicitly on/off; any other value
        // (e.g. the "inherit" sentinel) is omitted so the embed theme decides.
        $query = [];
        foreach (['autoplay', 'controls', 'loop', 'muted'] as $param) {
            $value = isset($options[$param]) ? (string) $options[$param] : '';
            if ('0' === $value || '1' === $value) {
                $query[$param] = $value;
            }
        }

        if ([] !== $query) {
            $url .= '?' . http_build_query($query);
        }

        return $url;
    }

    /**
     * Renders the hosted player iframe directly. `allow="autoplay"` is required so a cross-origin
     * embed may autoplay when the player options request it (direct presentation mode).
     * `$eager` drops the lazy hint for an above-the-fold/LCP block.
     *
     * @param array<string, mixed>|null $video
     * @param array<string, string|int> $options player options forwarded to the embed URL
     */
    public function renderEmbed(?array $video, string $title = 'Video', array $options = [], bool $eager = false): string
    {
        $url = $this->embedUrl($video, $options);
        if (null === $url) {
            return '';
        }

        return \sprintf(
            '<iframe src="%s" title="%s" loading="%s" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="border:0;width:100%%;height:100%%;aspect-ratio:16/9"></iframe>',
            htmlspecialchars($url, \ENT_QUOTES),
            htmlspecialchars(self::str($video['title'] ?? $title), \ENT_QUOTES),
            $eager ? 'eager' : 'lazy',
        );
    }

    /**
     * Renders a silent, looping HLS background <video>. hls.js is wired client-side by vo-blocks.js;
     * the poster covers the no-JS and reduced-motion cases. When $priority is true (above-the-fold
     * hero) preload is hinted to "auto" (mainly affects the Safari-native path; hls.js manages its
     * own buffering) — a mild LCP hint, not a guarantee.
     *
     * @param array<string, mixed>|null $video
     */
    public function renderBackground(?array $video, bool $priority = false): string
    {
        if (null === $video || empty($video['uuid'])) {
            return '';
        }

        $sources = $this->embedResolver->getSources(self::str($video['uuid']));
        $poster = $sources['poster'] ?? ($video['posterUrl'] ?? null);
        $hlsUrl = $sources['hlsUrl'] ?? null;

        return \sprintf(
            '<video class="vo-bg-hero__video" muted autoplay loop playsinline preload="%s"%s%s></video>',
            $priority ? 'auto' : 'metadata',
            null !== $poster ? \sprintf(' poster="%s"', htmlspecialchars(self::str($poster), \ENT_QUOTES)) : '',
            null !== $hlsUrl ? \sprintf(' data-hls="%s"', htmlspecialchars($hlsUrl, \ENT_QUOTES)) : '',
        );
    }

    /**
     * Renders a native HTML5 <video> built from the embed sources (HLS master via hls.js wired by
     * vo-blocks.js; MP4/WebM as native fallback). Theme accent is passed as a CSS var.
     *
     * When $eager is false the <video> is rendered DEFERRED: preload="none" and no autoplay/muted,
     * so it fetches nothing until something actually plays it — a facade/lightbox reveal-on-click
     * (vo-blocks.js `revealNative()`/lightbox `open()`), or, for a 'direct' non-priority block,
     * vo-blocks.js calling play() once it scrolls into view (see $autoload). $eager is reserved for
     * the above-the-fold 'direct' + priority case, which keeps autoplay+muted (when requested) and
     * preload="auto".
     *
     * @param array<string, mixed>|null $video
     * @param array<string, string|int> $options
     */
    public function renderNative(?array $video, array $options = [], bool $eager = false, bool $autoload = false): string
    {
        if (null === $video || empty($video['uuid'])) {
            return '';
        }

        $playable = $this->embedResolver->getPlayable(self::str($video['uuid']));
        $poster = $playable['poster'] ?? ($video['posterUrl'] ?? null);

        $hls = null;
        $fallback = [];
        foreach ($playable['sources'] as $source) {
            if ('application/vnd.apple.mpegurl' === $source['type']) {
                $hls = $source['src'];
            } else {
                $fallback[] = $source;
            }
        }

        $attrs = 'class="vo-native" playsinline controls preload="' . ($eager ? 'auto' : 'none') . '"';
        $autoplayEager = $eager && isset($options['autoplay']) && '1' === (string) $options['autoplay'];
        if ($autoplayEager) {
            $attrs .= ' autoplay muted';
        } elseif (isset($options['muted']) && '1' === (string) $options['muted']) {
            // Not autoplaying (yet), but the editor explicitly muted the block: a JS-triggered
            // play() later (reveal-on-click, scroll-into-view autoload) needs the attribute
            // already present, since browsers only allow unmuted autoplay after a user gesture.
            $attrs .= ' muted';
        }
        if (isset($options['loop']) && '1' === (string) $options['loop']) {
            $attrs .= ' loop';
        }
        if ($autoload) {
            // Marks a deferred, already-visible <video> (direct + non-priority) so vo-blocks.js can
            // find it and play() it once it scrolls into view.
            $attrs .= ' data-vo-native-autoload';
        }
        if (null !== $poster) {
            $attrs .= ' poster="' . htmlspecialchars(self::str($poster), \ENT_QUOTES) . '"';
        }
        if (null !== $hls) {
            $attrs .= ' data-hls="' . htmlspecialchars($hls, \ENT_QUOTES) . '"';
        }

        $sourceTags = '';
        foreach ($fallback as $source) {
            $sourceTags .= \sprintf('<source src="%s" type="%s">', htmlspecialchars($source['src'], \ENT_QUOTES), htmlspecialchars($source['type'], \ENT_QUOTES));
        }

        $accent = $playable['theme']['accentColor'] ?? null;
        $style = \is_string($accent) && '' !== $accent ? ' style="--vo-player-accent:' . htmlspecialchars($accent, \ENT_QUOTES) . '"' : '';

        return \sprintf('<video %s%s>%s</video>', $attrs, $style, $sourceTags);
    }

    /**
     * Casts a value read from the (mixed-typed) stored video/block property to a string,
     * defaulting to '' for non-scalars.
     */
    private static function str(mixed $value): string
    {
        return \is_scalar($value) ? (string) $value : '';
    }
}
