# Changelog

All notable changes to this package. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning: [SemVer](https://semver.org/).

## [Unreleased]

### Upgrade
- `api_base_url` and `embed_base_url` must be public https URLs (no credentials, query, localhost or private IPs): otherwise videos are not shown and the admin reports a configuration error ([#12](https://github.com/ScaleCommerce/videooptimizer-sulu/issues/12))

### Fixed
- API client no longer follows redirects, validates the base URL and refuses private network targets ([#12](https://github.com/ScaleCommerce/videooptimizer-sulu/issues/12))

## [1.8.1] - 2026-11-27

### Upgrade
- Hosted embeds without an explicit `embed_base_url` now load from `https://player.videooptimizer.eu`: allow it in your CSP `frame-src` and consent tools, or set `embed_base_url: 'https://videooptimizer.eu'` ([#1](https://github.com/ScaleCommerce/videooptimizer-sulu/issues/1))

### Added
- Libraries: show and set the quality mode (`encoding_quality`: performance or quality) and re-encode finished renditions with a forced reprocess ([#3](https://github.com/ScaleCommerce/videooptimizer-sulu/issues/3))
- Failed videos and URL imports show the reason reported by the API ([#2](https://github.com/ScaleCommerce/videooptimizer-sulu/issues/2))
- URL import: hint next to the URL field and a clear message for rejected video platform links such as YouTube ([#5](https://github.com/ScaleCommerce/videooptimizer-sulu/issues/5))

### Changed
- Embed data is cached in a dedicated pool shared by the admin and website kernels (`var/share`, or `kernel.share_dir`); set `scale_video_optimizer.cache_pool` to use your own pool, e.g. Redis ([#6](https://github.com/ScaleCommerce/videooptimizer-sulu/issues/6))
- Embed lookups are cached for 1 hour (was 24 hours), for 60 seconds when a video has no sources yet or the API fails, and are dropped when a video or its library is changed, deleted or reprocessed in the admin ([#6](https://github.com/ScaleCommerce/videooptimizer-sulu/issues/6))
- Custom poster upload no longer calls `poster/select`; the admin waits until the API has activated the poster ([#4](https://github.com/ScaleCommerce/videooptimizer-sulu/issues/4))
- Bundled hls.js updated to 1.7.4 ([#8](https://github.com/ScaleCommerce/videooptimizer-sulu/issues/8))

### Fixed
- Block poster image uses the current poster from the embed data instead of the one stored in the page ([#7](https://github.com/ScaleCommerce/videooptimizer-sulu/issues/7))

## [1.8.0] - 2026-11-27

### Added
- API requests send a `User-Agent: VideoOptimizer-Sulu/<version> (Sulu …; PHP …; +<site url>)` header.

## [1.7.2] - 2026-09-29

### Fixed
- Background hero "Prioritize loading" now implies eager loading and preloads the poster; `video_optimizer_background()` with `priority: true` implies `eager`.
- German background hero help texts showed transliterations instead of umlauts.
- `vo-blocks.js` initialises when it runs after `DOMContentLoaded`.

## [1.7.1] - 2026-09-29

### Fixed
- Background heroes saved before 1.7.0 no longer cause an HTTP 500.

## [1.7.0] - 2026-09-11

### Breaking
- Background videos now load after the page by default; tick "Load video immediately" per video to restore the old behaviour.

### Added
- Block checkbox "Load video immediately" and `eager` argument (default `false`) for `video_optimizer_background()`.
- Deferred background videos start at the latest 6 seconds after setup, even if `load` never fires.

### Changed
- Help text of "Prioritize loading (above the fold)" corrected.

## [1.6.2] - 2026-09-11

### Fixed
- Background videos hidden with `display:none` are no longer streamed; they load once they become visible.

## [1.6.1] - 2026-09-11

### Fixed
- `video_optimizer_background()` sets `aria-hidden="true"` on its `<video>`.

## [1.6.0] - 2026-09-11

### Added
- Twig function `video_optimizer_sources(video)` returns resolved sources as data for custom markup.
- `data-vo-hls` attribute wires HLS playback on custom `<video data-hls>` markup.

## [1.5.2] - 2026-07-24

### Added
- Frontend CSS/JS is injected automatically on pages with a VideoOptimizer surface; disable with `scale_video_optimizer.auto_inject_assets: false`.

## [1.5.1] - 2026-07-23

### Fixed
- A failed encoding after upload or URL import shows a "processing failed" message instead of "Connection failed".

## [1.5.0] - 2026-07-20

### Added
- `@ScaleVideoOptimizer/partials/assets.html.twig` loads the frontend assets; pass `blocks` to load them only when a `vo_*` block is rendered.

## [1.4.0] - 2026-07-20

### Breaking
- Block XML files are now standalone templates: replace `xi:include` of them with `<type ref="vo_media_split"/>` (likewise `vo_background_hero`, `vo_spotlight`, `vo_video_grid`).

### Added
- The four blocks are global, referenceable block types.

### Changed
- Block titles carry a `[VO]` prefix in the admin block picker.

## [1.3.2] - 2026-07-17

### Fixed
- `scale:videooptimizer:install` no longer crashes on shutdown; run `bin/adminconsole cache:clear` afterwards.

## [1.3.1] - 2026-07-17

### Fixed
- Admin API routes are reachable right after install (no 404 until `cache:clear`).

## [1.3.0] - 2026-07-17

### Added
- Command `scale:videooptimizer:uninstall` (supports `--force` and `--dry-run`).
- Config keys `api_base_url` and `embed_base_url` under `scale_video_optimizer`.

## [1.2.0] - 2026-07-17

### Added
- Command `scale:videooptimizer:install` sets up routes, admin JS and the `vo_settings` table (supports `--dry-run`).

## [1.1.0] - 2026-07-17

### Changed
- Admin JS ships pre-compiled; the `webpack.config.js` babel-exclude edit is no longer needed.

## [1.0.2] - 2026-07-17

### Changed
- Passes PHPStan level max.

## [1.0.1] - 2026-07-17

### Fixed
- Showcase template no longer breaks Sulu live preview.

## [1.0.0] - 2026-07-17

### Added
- "VideoOptimizer showcase" page template with all four blocks.

## [0.3.0] - 2026-07-17

### Added
- "Remove token" action on the Settings page.
- Symfony Flex recipe.

### Changed
- Settings form always renders; views show actionable messages for a missing token (428) or unreachable admin API (404).

## [0.2.0] - 2026-07-17

### Breaking
- Run `doctrine:schema:update` (or a migration) for the new `default_player` column.

### Added
- Encoding options (codec and resolution chips) and library cockpit (video count, storage, ladder, reprocess).
- Video upload and remote-URL ingest from the Videos view.
- Video management: thumbnail selection, custom poster (upload or Sulu media), title and player options, delete.
- Dedicated Videos view and management panel in the selection overlay.
- Per-block player choice (hosted embed or native `<video>`) with lazy loading, plus a global default player setting.
- Per-block `muted` option.
- Videos browsable as library folder tiles.

### Changed
- Libraries view redesigned in Sulu media style; delivery-only libraries are read-only.
- Videos load through `GET /videos` with cursor pagination.
- VideoOptimizer is a top-level navigation section.
- Selection overlay uses the form's locale.
- Video detail shows facts and the live poster with an embedded player on click.

### Fixed
- Switching back to an uploaded custom poster no longer requires re-upload.
- Portrait posters and thumbnails are no longer cropped.
- Admin previews bypass the CDN cache.
- Uniform video grid in the selection overlay.
- Video detail title field label.

## [0.1.0] - 2026-07-14

### Added
- `video_optimizer` field type, selection/upload overlay and library management.
- Blocks `vo_media_split`, `vo_background_hero`, `vo_spotlight`, `vo_video_grid` with facade/lightbox/direct modes.
- Server-side encrypted API token with proxy routes.
- Presigned multipart upload.
