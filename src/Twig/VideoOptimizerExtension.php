<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Twig;

use Psr\Log\LoggerInterface;
use Scale\VideoOptimizerBundle\Api\BaseUrlGuard;
use Scale\VideoOptimizerBundle\EventListener\AssetInjectionListener;
use Scale\VideoOptimizerBundle\Service\SettingsManager;
use Scale\VideoOptimizerBundle\Service\VideoListProvider;
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
        private ?LoggerInterface $logger = null,
        private string $apiBaseUrl = 'https://api.videooptimizer.eu/api/v1',
        private ?VideoListProvider $videoList = null,
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
            new TwigFunction('video_optimizer_poster', [$this, 'poster']),
            new TwigFunction('video_optimizer_asset_version', [$this, 'assetVersion']),
            new TwigFunction('video_optimizer_format', [$this, 'format']),
            new TwigFunction('video_optimizer_scenes', [$this, 'scenes']),
            new TwigFunction('video_optimizer_videos', [$this, 'videos']),
            new TwigFunction('video_optimizer_uuid', [VideoListProvider::class, 'uuid']),
            new TwigFunction('video_optimizer_title', [$this, 'title']),
            new TwigFunction('video_optimizer_detail_url', [$this, 'detailUrl']),
            new TwigFunction('video_optimizer_duration', [self::class, 'timeLabel']),
            new TwigFunction('video_optimizer_t', [self::class, 'translate']),
            new TwigFunction('video_optimizer_native', [$this, 'renderNative'], ['is_safe' => ['html']]),
            // No 'is_safe': this returns data, not markup. See sources() for why a consumer
            // that renders its own markup must wire the frontend assets itself.
            new TwigFunction('video_optimizer_sources', [$this, 'sources']),
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
     * @return array{autoplay: string, controls: string, loop: string, muted: string, fit?: string}
     */
    public function playerOptions(?array $block): array
    {
        $block ??= [];
        $autoplay = self::str($block['autoplay'] ?? 'inherit');

        $options = [
            'autoplay' => 'inherit' === $autoplay ? '1' : $autoplay,
            'controls' => self::str($block['controls'] ?? 'inherit'),
            'loop' => self::str($block['loop'] ?? 'inherit'),
            'muted' => self::str($block['muted'] ?? 'inherit'),
        ];
        if (null !== $this->format($block)['ratio']) {
            // A fixed format makes the hosted embed fill the area instead of letterboxing.
            $options['fit'] = 'cover';
        }

        return $options;
    }

    private const FORMATS = [
        '16_9' => ['16 / 9', false],
        '9_16' => ['9 / 16', true],
        '1_1' => ['1 / 1', false],
        '4_5' => ['4 / 5', true],
        '21_9' => ['21 / 9', false],
    ];

    /**
     * The "Format" and focal-point options of a block: the CSS aspect ratio (null = the video's own),
     * whether the surface is a tall one that gets a maximum width, and the `object-position` value
     * (null = centred). Out-of-range or non-numeric focal values are clamped or ignored.
     *
     * @param array<string, mixed>|null $block
     *
     * @return array{key: string, ratio: ?string, tall: bool, focus: ?string}
     */
    public function format(?array $block): array
    {
        $key = self::str($block['format'] ?? 'original');
        $entry = self::FORMATS[$key] ?? null;
        $x = self::percent($block['focusX'] ?? null);
        $y = self::percent($block['focusY'] ?? null);

        return [
            'key' => null === $entry ? 'original' : $key,
            'ratio' => $entry[0] ?? null,
            'tall' => $entry[1] ?? false,
            'focus' => 50 === $x && 50 === $y ? null : $x . '% ' . $y . '%',
        ];
    }

    private static function percent(mixed $value): int
    {
        return \is_numeric($value) ? max(0, min(100, (int) round((float) $value))) : 50;
    }

    /**
     * Scene previews for the chapters block: the video's auto-generated thumbnails (`thumbnails/0..9`,
     * sampled by the encoder at duration / 11 * (i + 1)), `$count` of them spread evenly. Empty when the
     * duration is unknown or there is no video.
     *
     * @param array<string, mixed>|null $video
     *
     * @return list<array{index: int, start: int, time: string, title: string, label: string, src: string}>
     */
    public function scenes(?array $video, int|string|null $count = 5, ?string $titles = null, string $locale = 'en'): array
    {
        $uuid = self::uuidOf($video);
        if (null === $uuid) {
            return [];
        }
        $duration = $this->embedResolver->getSources($uuid)['duration'] ?? null;
        if (null === $duration || $duration <= 0) {
            return [];
        }
        try {
            BaseUrlGuard::assertHttps($this->apiBaseUrl, 'API base URL');
        } catch (\InvalidArgumentException $e) {
            $this->logger?->warning($e->getMessage(), ['url' => $this->apiBaseUrl]);

            return [];
        }

        $count = max(3, min(10, \is_numeric($count) ? (int) $count : 5));
        $lines = array_map('trim', preg_split('/\R/', (string) $titles) ?: []);
        $scenes = [];
        for ($k = 0; $k < $count; ++$k) {
            $index = (int) round($k * 9 / ($count - 1));
            $start = (int) floor($duration / 11 * ($index + 1));
            $time = self::timeLabel($start);
            $title = $lines[$k] ?? '';
            $scenes[] = [
                'index' => $index,
                'start' => $start,
                'time' => $time,
                'title' => $title,
                'label' => self::translate('scene', $locale, ['{n}' => (string) ($k + 1), '{time}' => $time]),
                'src' => rtrim($this->apiBaseUrl, '/') . '/videos/' . rawurlencode($uuid) . '/thumbnails/' . $index,
            ];
        }

        return $scenes;
    }

    /**
     * Seconds as `m:ss` (or `h:mm:ss` from one hour).
     */
    public static function timeLabel(?int $seconds): string
    {
        $seconds = max(0, (int) $seconds);

        return $seconds >= 3600
            ? \sprintf('%d:%02d:%02d', intdiv($seconds, 3600), intdiv($seconds % 3600, 60), $seconds % 60)
            : \sprintf('%d:%02d', intdiv($seconds, 60), $seconds % 60);
    }

    private const TEXTS = [
        'en' => [
            'scene' => 'Scene {n} · {time}',
            'scene_title' => '{title} · {time}',
            'scenes' => 'Scenes',
            'not_found' => 'This video was not found.',
            'no_videos' => 'No videos found.',
            'unavailable' => 'The videos are currently unavailable.',
            'pagination' => 'Video pages',
            'first' => 'First page',
            'next' => 'More videos',
            'play' => 'Play video',
        ],
        'de' => [
            'scene' => 'Szene {n} · {time}',
            'scene_title' => '{title} · {time}',
            'scenes' => 'Szenen',
            'not_found' => 'Dieses Video wurde nicht gefunden.',
            'no_videos' => 'Keine Videos gefunden.',
            'unavailable' => 'Die Videos sind derzeit nicht verfügbar.',
            'pagination' => 'Videoseiten',
            'first' => 'Erste Seite',
            'next' => 'Weitere Videos',
            'play' => 'Video abspielen',
        ],
    ];

    /**
     * Frontend text in the page language (en, de; anything else falls back to en).
     *
     * @param array<string, string> $replace
     */
    public static function translate(string $key, ?string $locale = null, array $replace = []): string
    {
        $lang = strtolower(substr((string) $locale, 0, 2));
        $text = (self::TEXTS[$lang] ?? self::TEXTS['en'])[$key] ?? self::TEXTS['en'][$key] ?? $key;

        return strtr($text, $replace);
    }

    /**
     * One page of the finished videos of a library for the list block.
     *
     * @return array{items: list<array{uuid: string, title: string, poster: ?string, duration: ?int}>, next: ?string, error: bool}
     */
    public function videos(?string $libraryId, ?string $tags = null, ?string $cursor = null, int|string|null $limit = null): array
    {
        if (null === $this->videoList) {
            return ['items' => [], 'next' => null, 'error' => true];
        }

        return $this->videoList->page($libraryId, $tags, $cursor, \is_numeric($limit) && (int) $limit > 0 ? (int) $limit : VideoListProvider::DEFAULT_PAGE_SIZE);
    }

    /**
     * Title of a video from the cached embed lookup, or null.
     */
    public function title(?string $uuid): ?string
    {
        $uuid = VideoListProvider::uuid($uuid);
        $title = null === $uuid ? null : ($this->embedResolver->getSources($uuid)['title'] ?? null);

        return \is_string($title) && '' !== $title ? $title : null;
    }

    /**
     * Link from a list card to the detail page: `<page>?vo_video=<uuid>`. Only site-relative paths and
     * http(s) URLs count; anything else (javascript:, data:, protocol-relative) yields null.
     */
    public function detailUrl(?string $page, ?string $uuid): ?string
    {
        $page = trim((string) $page);
        $uuid = VideoListProvider::uuid($uuid);
        if (null === $uuid || '' === $page || 1 === preg_match('/[\x00-\x20\\\\]/', $page)) {
            return null;
        }
        $relative = str_starts_with($page, '/') && !str_starts_with($page, '//');
        if (!$relative && 1 !== preg_match('#^https?://[^/]#i', $page)) {
            return null;
        }
        $page = preg_replace('/#.*$/', '', $page) ?? $page;
        // Replace a vo_video of an earlier link instead of stacking them.
        $page = preg_replace('/([?&])vo_video=[^&]*&?/', '$1', $page) ?? $page;
        $page = rtrim($page, '?&');

        return $page . (str_contains($page, '?') ? '&' : '?') . 'vo_video=' . $uuid;
    }

    /**
     * Returns the current poster URL of a video: the API's active poster (kept current by the API,
     * stable URL), else the `posterUrl` stored in the page property.
     *
     * @param array<string, mixed>|null $video
     */
    public function poster(?array $video): ?string
    {
        $uuid = self::uuidOf($video);
        $resolved = null === $uuid ? null : ($this->embedResolver->getSources($uuid)['poster'] ?? null);

        return self::posterFor($video, $resolved);
    }

    /**
     * Returns a responsive poster srcset for a video (from the cached embed lookup), or null.
     *
     * @param array<string, mixed>|null $video
     */
    public function srcset(?array $video): ?string
    {
        $uuid = self::uuidOf($video);

        return null === $uuid ? null : $this->embedResolver->getPosterSrcset($uuid);
    }

    /**
     * Renders a schema.org VideoObject JSON-LD block for SEO/rich results. Metadata (poster,
     * duration) comes from the cached embed lookup; returns '' when there is no video.
     *
     * @param array<string, mixed>|null $video
     */
    public function schema(?array $video, ?string $name = null): string
    {
        $uuid = self::uuidOf($video);
        if (null === $uuid) {
            return '';
        }

        $sources = $this->embedResolver->getSources($uuid);

        $data = ['@context' => 'https://schema.org', '@type' => 'VideoObject'];

        $name = $name ?? ($video['title'] ?? null);
        if (\is_string($name) && '' !== $name) {
            $data['name'] = $name;
        }

        $poster = self::posterFor($video, $sources['poster'] ?? null);
        if (null !== $poster) {
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
        $uuid = self::uuidOf($video);
        if (null === $uuid) {
            return ['width' => null, 'height' => null, 'orientation' => null];
        }

        return $this->embedResolver->getDimensions($uuid);
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
        $uuid = self::uuidOf($video);
        if (null === $uuid) {
            return null;
        }

        try {
            BaseUrlGuard::assertHttps($this->embedBaseUrl, 'embed base URL');
        } catch (\InvalidArgumentException $e) {
            // Render without the video instead of pointing visitors (or an iframe) at an unsafe host.
            $this->logger?->warning($e->getMessage(), ['url' => $this->embedBaseUrl]);

            return null;
        }

        $url = rtrim($this->embedBaseUrl, '/') . '/embed/' . rawurlencode($uuid);

        // Only append boolean player params that are explicitly on/off; any other value
        // (e.g. the "inherit" sentinel) is omitted so the embed theme decides.
        $query = [];
        foreach (['autoplay', 'controls', 'loop', 'muted'] as $param) {
            $value = isset($options[$param]) ? (string) $options[$param] : '';
            if ('0' === $value || '1' === $value) {
                $query[$param] = $value;
            }
        }

        if ('cover' === ($options['fit'] ?? null)) {
            $query['fit'] = 'cover';
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

        return AssetInjectionListener::SENTINEL . \sprintf(
            '<iframe src="%s" title="%s" loading="%s" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="border:0;width:100%%;height:100%%;aspect-ratio:16/9"></iframe>',
            htmlspecialchars($url, \ENT_QUOTES),
            htmlspecialchars(self::str($video['title'] ?? $title), \ENT_QUOTES),
            $eager ? 'eager' : 'lazy',
        );
    }

    /**
     * Renders a silent, looping, decorative HLS background <video>. hls.js is wired client-side by
     * vo-blocks.js, by default only after the page has loaded; the poster covers the no-JS and
     * reduced-motion cases.
     *
     * $eager marks the video with `data-vo-hls-eager` so vo-blocks.js starts the stream right away
     * instead of after `load`. $priority is for an above-the-fold (LCP) hero and implies $eager; on
     * top it preloads the poster with `fetchpriority="high"` (a `<link rel="preload">` is allowed in
     * the body) and hints `preload="auto"`.
     *
     * @param array<string, mixed>|null $video
     */
    public function renderBackground(?array $video, bool $priority = false, bool $eager = false): string
    {
        $uuid = self::uuidOf($video);
        if (null === $uuid) {
            return '';
        }

        $sources = $this->embedResolver->getSources($uuid);
        $poster = self::posterFor($video, $sources['poster'] ?? null);
        $hlsUrl = $sources['hlsUrl'] ?? null;
        $mp4Url = self::fallbackMp4($sources['sources']);
        $posterAttr = null !== $poster ? htmlspecialchars($poster, \ENT_QUOTES) : null;

        $preload = $priority && null !== $posterAttr
            ? \sprintf('<link rel="preload" as="image" href="%s" fetchpriority="high">', $posterAttr)
            : '';

        return AssetInjectionListener::SENTINEL . $preload . \sprintf(
            '<video class="vo-bg-hero__video" muted autoplay loop playsinline aria-hidden="true" preload="%s"%s%s%s%s></video>',
            $priority ? 'auto' : 'metadata',
            null !== $posterAttr ? \sprintf(' poster="%s"', $posterAttr) : '',
            null !== $hlsUrl ? \sprintf(' data-hls="%s"', htmlspecialchars($hlsUrl, \ENT_QUOTES)) : '',
            // Fallback for vo-blocks.js when HLS fails or is unsupported.
            null !== $hlsUrl && null !== $mp4Url ? \sprintf(' data-mp4="%s"', htmlspecialchars($mp4Url, \ENT_QUOTES)) : '',
            // Absence is the default (deferred), so custom markup inherits it without changes.
            $eager || $priority ? ' data-vo-hls-eager' : '',
        );
    }

    /**
     * Renders a native HTML5 <video> built from the embed sources (HLS master via hls.js wired by
     * vo-blocks.js; MP4/WebM as native fallback). The organization's player theme (controls, autoplay, muted start, loop, preload, accent colour as `--vo-accent`) is applied; block options win.
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
        $uuid = self::uuidOf($video);
        if (null === $uuid) {
            return '';
        }

        $playable = $this->embedResolver->getPlayable($uuid);
        $poster = self::posterFor($video, $playable['poster'] ?? null);

        $hls = null;
        $fallback = [];
        foreach ($playable['sources'] as $source) {
            if (VideoOptimizerEmbedResolver::HLS_MIME === $source['type']) {
                $hls = $source['src'];
            } else {
                $fallback[] = $source;
            }
        }

        $theme = \is_array($playable['theme'] ?? null) ? $playable['theme'] : [];

        // The block's explicit option wins, then the organization's player theme, then the default.
        // Theme keys without a native counterpart (control bar colour, play button, menus for speed,
        // quality, volume, time, fullscreen, PiP) are ignored: the browser draws those controls.
        $wantsAutoplay = self::flag($options['autoplay'] ?? null, $theme['autoplay'] ?? null, false);
        $autoplay = $eager && $wantsAutoplay;
        $autoplays = $autoplay || ($autoload && $wantsAutoplay); // plays by itself, now or on scroll
        // A hidden control bar (theme controls/interactive false) only fits a video that plays by itself;
        // otherwise visitors could not start, pause or unmute it. An explicit block option still wins.
        $interactive = !$autoplays || false !== ($theme['interactive'] ?? null);
        $themeControls = $autoplays ? $theme['controls'] ?? null : null;
        $controls = self::flag($options['controls'] ?? null, $themeControls, true) && $interactive;
        $loop = self::flag($options['loop'] ?? null, $theme['loopButton'] ?? null, false);
        $muted = $autoplay || self::flag($options['muted'] ?? null, $theme['mutedStart'] ?? null, false);
        // Never load video data before playback: deferred players stay at `none`; only an eager (priority)
        // player that autoplays may use the theme value, and one that does not autoplay stops at `metadata`.
        $themePreload = $theme['preload'] ?? null;
        if (!$eager) {
            $preload = 'none';
        } elseif ($autoplay) {
            $preload = \in_array($themePreload, ['auto', 'metadata', 'none'], true) ? $themePreload : 'auto';
        } else {
            $preload = 'none' === $themePreload ? 'none' : 'metadata';
        }

        $attrs = 'class="vo-native' . ($interactive ? '' : ' vo-native--static') . '" playsinline' . ($controls ? ' controls' : '') . ' preload="' . $preload . '"';
        if ($autoplay) {
            $attrs .= ' autoplay muted';
        } elseif ($muted) {
            // Not autoplaying (yet), but muted by the block or the theme: a JS-triggered play()
            // later (reveal-on-click, scroll-into-view autoload) needs the attribute already
            // present, since browsers only allow unmuted autoplay after a user gesture.
            $attrs .= ' muted';
        }
        if ($loop) {
            $attrs .= ' loop';
        }
        if ($autoload && $wantsAutoplay) {
            // Marks a deferred, already-visible <video> (direct + non-priority) so vo-blocks.js can
            // find it and play() it once it scrolls into view.
            $attrs .= ' data-vo-native-autoload';
        } elseif (($eager && !$autoplay) || $autoload) {
            // Visible but not autoplaying: vo-blocks.js attaches the source on the first play, so
            // nothing but the poster is fetched before the visitor starts it.
            $attrs .= ' data-vo-native-onplay';
        }
        if (null !== $poster) {
            $attrs .= ' poster="' . htmlspecialchars($poster, \ENT_QUOTES) . '"';
        }
        if (null !== $hls) {
            $attrs .= ' data-hls="' . htmlspecialchars($hls, \ENT_QUOTES) . '"';
        }

        $sourceTags = '';
        foreach ($fallback as $source) {
            $sourceTags .= \sprintf('<source src="%s" type="%s">', htmlspecialchars($source['src'], \ENT_QUOTES), htmlspecialchars($source['type'], \ENT_QUOTES));
        }

        $accent = $theme['accentColor'] ?? null;
        $style = '';
        if (\is_string($accent) && 1 === preg_match('/^[#a-zA-Z0-9(),.%\s\/-]{1,64}$/', $accent)) {
            // --vo-player-accent is kept for theme overrides written against 2.0.
            $accentAttr = htmlspecialchars($accent, \ENT_QUOTES);
            $style = ' style="--vo-accent:' . $accentAttr . ';--vo-player-accent:' . $accentAttr . '"';
        }

        $trackTags = '';
        // @phpstan-ignore nullCoalesce.offset (entries cached or mocked without tracks)
        foreach ($playable['tracks'] ?? [] as $track) {
            $trackTags .= \sprintf(
                '<track kind="%s" srclang="%s" label="%s" src="%s"%s>',
                htmlspecialchars($track['kind'], \ENT_QUOTES),
                htmlspecialchars($track['srclang'], \ENT_QUOTES),
                htmlspecialchars($track['label'], \ENT_QUOTES),
                htmlspecialchars($track['src'], \ENT_QUOTES),
                $track['default'] ? ' default' : '',
            );
        }
        if ('' !== $trackTags) {
            // The WebVTT files are fetched cross-origin from the CDN, which allows any origin.
            $attrs .= ' crossorigin="anonymous"';
        }

        return AssetInjectionListener::SENTINEL . \sprintf('<video %s%s>%s%s</video>', $attrs, $style, $sourceTags, $trackTags);
    }

    /**
     * Returns the resolved sources of a stored video as DATA, so a consumer can render its own
     * markup instead of the bundle's.
     *
     * Why this exists: the rendering functions above (embed, background, native) emit finished
     * markup with fixed bundle classes (`vo-bg-hero__video`, `vo-native`, `vo-frame`). A consumer whose markup is
     * pixel-bound to a design of its own cannot use them without replacing that markup — so it
     * would otherwise have to rebuild the resolver lookup itself. This function hands over what
     * `VideoOptimizerEmbedResolver::getSources()` already knows and nothing else.
     *
     * Key names are the resolver's own: each source entry stays `{ src, type, label }`, the
     * vocabulary of an HTML `<source>` element. A first draft renamed them to Sulu's media wording
     * (`url`, `mimeType`) so that one particular consumer could swap a media object for a
     * VideoOptimizer source without touching its template. That was rejected on purpose: it would
     * put a translation layer for a single consumer's convenience inside the bundle, and a
     * consumer that wants that mapping can do it in two lines of Twig. The bundle stays faithful
     * to the data it already holds — this function passes through, it does not adapt.
     *
     * The poster falls back to the stored `posterUrl` via posterFor(), like every other path.
     *
     * ⚠️ NO ASSET SENTINEL, and that is not an omission. The rendering functions prepend
     * AssetInjectionListener::SENTINEL so the bundle's CSS/JS get injected automatically. This
     * function returns an array; there is no markup to carry a sentinel. A consumer that renders
     * its own `<video>` from this data therefore gets NO automatic asset injection, and must
     * either include `@ScaleVideoOptimizer/partials/assets.html.twig` itself or emit the sentinel
     * in its own template. Without that, HLS playback stays silent: the `data-hls` wiring lives in
     * `vo-blocks.js`. (A consumer that only uses MP4 sources natively needs neither.)
     *
     * @param array<string, mixed>|null $video the stored video property (needs `uuid`)
     *
     * @return array{poster: ?string, srcset: ?string, hlsUrl: ?string, sources: array<int, array{src: string, type: string, label: string}>, width: ?int, height: ?int, duration: ?int, theme: ?array<int|string, mixed>, tracks: array<int, array{src: string, srclang: string, label: string, kind: string, default: bool}>}|null
     *                                  null when no video is selected — same null behaviour as the
     *                                  rendering functions, which return an empty string there
     */
    public function sources(?array $video): ?array
    {
        $uuid = self::uuidOf($video);
        if (null === $uuid) {
            return null;
        }

        $resolved = $this->embedResolver->getSources($uuid);

        return [
            'poster' => self::posterFor($video, $resolved['poster'] ?? null),
            'srcset' => $resolved['srcset'] ?? null,
            'hlsUrl' => $resolved['hlsUrl'] ?? null,
            // Unchanged, key names included; extractSources() already dropped unusable entries.
            'sources' => $resolved['sources'],
            'width' => $resolved['width'] ?? null,
            'height' => $resolved['height'] ?? null,
            'duration' => $resolved['duration'] ?? null,
            'theme' => $resolved['theme'] ?? null,
            // @phpstan-ignore nullCoalesce.offset (entries cached or mocked without tracks)
            'tracks' => $resolved['tracks'] ?? [],
        ];
    }

    /**
     * Cache-busting token for the bundle's frontend CSS/JS (a hash of both files), so a browser never pairs
     * the old script with the new stylesheet after an update.
     */
    public function assetVersion(): string
    {
        /** @var string|null $version */
        static $version = null;
        if (null === $version) {
            $dir = \dirname(__DIR__) . '/Resources/public/';
            $hash = '';
            foreach (['css/vo-blocks.css', 'js/vo-blocks.js'] as $file) {
                $hash .= (string) @md5_file($dir . $file);
            }
            $version = substr(md5($hash), 0, 10);
        }

        return $version;
    }

    /**
     * Resolves an on/off player setting: the block option ('1'/'0') first, then the theme value
     * (bool), then the default. A bool option counts like '1'/'0'. Anything else, such as the 'inherit' sentinel, defers to the next.
     */
    private static function flag(mixed $option, mixed $theme, bool $default): bool
    {
        if (\is_bool($option)) {
            return $option;
        }
        $option = \is_scalar($option) ? (string) $option : '';
        if ('1' === $option || '0' === $option) {
            return '1' === $option;
        }

        return \is_bool($theme) ? $theme : $default;
    }

    /**
     * MP4 for the script's HLS fallback: the 720p rendition, else the largest up to 1080p, else the first.
     *
     * @param array<int, array{src:string,type:string,label:string}> $sources
     */
    private static function fallbackMp4(array $sources): ?string
    {
        $first = null;
        $best = null;
        $bestHeight = 0;
        foreach ($sources as $source) {
            if (!str_starts_with(strtolower($source['type']), 'video/mp4')) {
                continue;
            }
            $first ??= $source['src'];
            $height = 1 === preg_match('/(\d{3,4})\s*p/i', $source['label'] . ' ' . $source['src'], $m) ? (int) $m[1] : 0;
            if (720 === $height) {
                return $source['src'];
            }
            if ($height <= 1080 && $height > $bestHeight) {
                $best = $source['src'];
                $bestHeight = $height;
            }
        }

        return $best ?? $first;
    }

    /**
     * Returns the uuid of a stored video property, or null when no video is selected.
     *
     * @param array<string, mixed>|null $video
     */
    private static function uuidOf(?array $video): ?string
    {
        $uuid = self::str($video['uuid'] ?? null);

        return '' === $uuid ? null : $uuid;
    }

    /**
     * The poster shared by every render path: the API's active poster, else the stored `posterUrl`.
     *
     * @param array<string, mixed>|null $video
     */
    private static function posterFor(?array $video, ?string $resolved): ?string
    {
        if (null !== $resolved && '' !== $resolved) {
            return $resolved;
        }
        $stored = $video['posterUrl'] ?? null;

        return \is_string($stored) && '' !== $stored ? $stored : null;
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
