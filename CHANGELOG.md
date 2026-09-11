# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.7.0] - 2026-09-11

### Added
- **Background videos load after the page, and editors can override it per video.** A background
  video is decoration — it is why the element carries `aria-hidden` since 1.6.1 — and loading
  decoration after the content is the defensible default. Until now the HLS stream started at
  `DOMContentLoaded` and competed with the page for bandwidth. Measured on a real site with four
  background videos, 8 runs per condition at 1440 px, wiring on/off as the only difference and the
  Largest Contentful Paint element verified identical in every run (an image, not a video frame):
  the ranges do not overlap in either network profile — LCP **1992–2256 ms** without wiring against
  **2376–3912 ms** with it on a fast mobile connection, and **3852–4488 ms** against
  **5048–6412 ms** on a slow one. Loading the videos immediately cost **0.36 s** and **1.5 s** of
  LCP respectively.
  The new block checkbox **"Load video immediately"** turns the deferral off for a single video.
  ⚠️ **Absence of the marker is the new default**, not its presence: existing content and consumers
  rendering their own markup (`video_optimizer_sources()` + `data-vo-hls`) inherit the deferred
  behaviour without changing anything. `video_optimizer_background()` takes a third argument
  `eager` (default `false`) and emits `data-vo-hls-eager` only when it is true.
  ⚠️ **`load` may already have fired** by the time the script runs — deferred injection, a slow
  stylesheet, a consumer wiring the assets by hand. A listener registered after the event never
  fires, and the result would be a background video with a poster that silently never plays. The
  deferral therefore asks `document.readyState === 'complete'` first and wires immediately in that
  case. Same failure mode 1.6.2 was built against, one layer up.
  Order of the three conditions is fixed and asserted: `prefers-reduced-motion` first, then the
  deferral, then the rendered check — the last one has to run *after* the wait, because a video
  that is `display:none` at `DOMContentLoaded` may well be rendered by the time `load` fires.

### Changed
- **The help text of "Prioritize loading (above the fold)" was wrong about what it does.** It
  suggested the video would preload sooner; in fact it only sets `preload="auto"`, and the stream
  is fetched by hls.js, which does not consult `preload`. It never touched the cause. The text now
  says what the checkbox does and points at the new setting for what editors actually wanted.

## [1.6.2] - 2026-09-11

### Fixed
- **Background videos that are not rendered are no longer wired.** `initBackgroundVideos()` attached
  the HLS stream to every matching `<video>`, including ones a stylesheet had switched off with
  `display:none` — a common pattern for hiding decorative background video on small screens. Those
  videos streamed their full ladder while never being shown: measured on a consuming site, a phone
  viewport pulled **2.03 MB** for four background videos of which three were hidden; with the check
  it pulls **764 KB**, the one video actually on the page. The gate sits next to the existing
  `prefers-reduced-motion` early return, in the same shape: what is not going to be seen is not
  wired.
  ⚠️ **The criterion is "would this be rendered at all", not "is this in the viewport".**
  `getClientRects()` is empty only when the element or an ancestor is `display:none`; a background
  video further down a long page still has rects and is still wired immediately. Keying on the
  viewport would have turned a bug fix into lazy loading for every consumer — a behaviour change
  nobody asked for, in a patch release.
  ⚠️ **Becoming visible later is handled.** A check that ran once would turn the saving into a dead
  video the moment the element appears — a window dragged from 640 to 1440, a `<details>` opened, a
  tab switched: present, silent, nothing in the console. A `ResizeObserver` reports a zero-sized box
  for a `display:none` element and fires when it gets a real one, so the video is wired at that
  point and the observer disconnects. Verified with a real resize in headless Chrome: at 640 px one
  of four videos wired (the one actually rendered), after resizing to 1440 px without reloading all
  four wired and the hero playing. Browsers without `ResizeObserver` wire immediately, as before —
  a lost byte saving is the smaller harm, a video that never plays the larger one.

## [1.6.1] - 2026-09-11

### Fixed
- **`video_optimizer_background()` hides its `<video>` from assistive technology.** The rendered
  element is decoration: it carries no information a screen reader could convey, and it has no
  accessible name to give one. Without `aria-hidden="true"` it still appeared in the accessibility
  tree as an unlabelled media element. That is a defect in the rendering function rather than a
  consumer's styling preference, since it reached every consumer of the function.
  `tabindex="-1"` was considered and deliberately left out: measured in headless Chrome with real
  Tab key events, a `<video>` without `controls` is not in the tab order at all (chain over
  `<a>`, `<video>`, `<video tabindex="-1">`, `<video controls>`, `<a>` is a → video[controls] → a),
  so the attribute would change nothing while looking as though it did. Its `tabIndex` IDL property
  reports `0`, which is why reading the property rather than pressing the key suggests otherwise.

## [1.6.0] - 2026-09-11

### Added
- **`video_optimizer_sources(video)` — the resolved sources as data.** The nine existing Twig
  functions all emit finished markup with fixed bundle classes (`vo-bg-hero__video`, `vo-native`,
  `vo-frame`). A consumer whose markup is bound to a design of its own could not use them without
  replacing that markup, and would have had to rebuild the resolver lookup itself. This function
  hands over what `VideoOptimizerEmbedResolver::getSources()` already knows — `poster`, `srcset`,
  `hlsUrl`, `sources` (each `{ src, type, label }`), `width`/`height`/`duration`, `theme` — and
  `null` when no video is selected. The entries keep the resolver's own key names: the function
  passes data through and does not adapt it to a consumer's field names. It is registered without
  `is_safe`, since it returns an array rather than markup.
  ⚠️ It carries **no asset sentinel**: automatic asset injection is gated on a sentinel that the
  rendering functions emit, and a data payload cannot carry one. Consumers rendering their own
  markup include `@ScaleVideoOptimizer/partials/assets.html.twig` themselves when they need the
  frontend JS (HLS playback does; plain MP4 playback does not) — **and, for HLS, mark the element
  with `data-vo-hls`** (see below). Including the assets alone is not enough.
- **`data-vo-hls` — an opt-in marker that wires HLS on foreign markup.** `vo-blocks.js` wired the
  HLS playlist only onto its own block class, so a consumer following the documented path above got
  a video that silently never played: the script loaded, nothing claimed the element, no console
  error. `initBackgroundVideos()` now also picks up any `<video data-vo-hls data-hls="…">`.
  The marker is deliberately an attribute opt-in rather than a widening to every `<video>` carrying `data-hls`:
  the native player path excludes facade holders and lazy-loading videos on purpose, and a blanket
  selector would reach into both. The hook sits inside `initBackgroundVideos()` so that foreign
  markup inherits its `prefers-reduced-motion` early exit; `data-hls` stays the URL carrier,
  `data-vo-hls` is a bare marker. Asserted in `tests/Unit/VoBlocksJsContractTest.php` — a source
  contract, not a behaviour proof; the bundle has no JS test environment.

## [1.5.2] - 2026-07-24

### Added
- **Automatic frontend asset injection.** The bundle now loads its frontend CSS/JS on pages that
  render a VideoOptimizer surface without any template edit — consumers no longer include a partial
  or hardcode asset paths. A `kernel.response` listener (`AssetInjectionListener`) inserts the
  stylesheet before `</head>` and the deferred script before `</body>` (for performance), gated on an
  invisible sentinel the frontend Twig emits, so pages without a VideoOptimizer surface stay
  untouched. Pages that already reference the assets (manual partial) are not double-loaded. Enabled
  by default; disable with `scale_video_optimizer.auto_inject_assets: false` to wire the assets
  manually via `@ScaleVideoOptimizer/partials/assets.html.twig` (e.g. for strict CSP or ESI setups).
  Requires the bundle assets to be published (`bin/console assets:install`).

## [1.5.1] - 2026-07-23

### Fixed
- When asynchronous encoding of an uploaded or URL-ingested video ends in `failed`, the Videos view
  now shows a dedicated "processing failed" message instead of reusing the connection-test string
  (which rendered the misleading "Connection failed: processing failed"). New translation key
  `scale_videooptimizer.processing_failed` (de/en).

## [1.5.0] - 2026-07-20

### Added
- Frontend asset loading is now a bundle feature: include `@ScaleVideoOptimizer/partials/assets.html.twig`
  from a page view's `{% block stylesheets %}` instead of hardcoding the CSS/JS paths in the host theme.
  The bundle owns the asset paths, so a future change to its asset structure no longer silently breaks
  consumers. Pass `blocks` (e.g. `{ blocks: content.content }`) to emit the assets only when the page
  actually renders a `vo_*` block; omit it to always emit them. The shipped showcase template now uses
  this partial itself.

## [1.4.0] - 2026-07-20

### Added
- The four content blocks are now registered as **global, referenceable block types** via the bundle's
  DI `prepend()` (`sulu_admin.templates.block.directories`). Any page or snippet template can offer them
  with a single `<type ref="vo_media_split"/>` line (also `vo_background_hero`, `vo_spotlight`,
  `vo_video_grid`) — no XInclude and no vendor paths.

### Changed
- Block titles now carry a visible `[VO]` prefix in the admin block picker so editors can recognize
  blocks that come from this bundle.
- **Breaking (template authoring):** the four block XML files moved from `<type name="…">` XInclude
  fragments to standalone `<template>` files with a `<key>`. Templates that previously pulled them in
  via `xi:include` must switch to `<type ref="…"/>`. The bundle's shipped showcase template was updated
  accordingly. (No stored content changes — the block type keys stay `vo_*`.)

### Documentation
- Clarify in the README that the `npm run build` step is Sulu's standard admin build, and that
  `sulu:build` is unrelated (data layer, not the admin JS).
- Warn that `sulu:admin:update-build` must not be used to install the bundle — it syncs `assets/admin`
  with the Sulu skeleton and its `package.json` default overwrite would strip the `videooptimizer-sulu`
  dependency added by `scale:videooptimizer:install`.

## [1.3.2] - 2026-07-17

### Fixed
- `scale:videooptimizer:install` no longer clears the cache itself. Doing so from inside the running
  process deleted the cache that process was still using and crashed on shutdown
  (`Failed to open stream: .../ContainerXXX/...`). Clearing the cache is now a separate step the command
  points to (`bin/adminconsole cache:clear`), as it must run in its own process.

### Documentation
- README quick-start: TL;DR command block, Symfony Flex auto-registration note, and `cache:clear` as an
  explicit step after the installer.

## [1.3.1] - 2026-07-17

### Fixed
- `scale:videooptimizer:install` now clears the cache after writing the route file, so the admin API is
  reachable immediately. Previously the freshly imported routes stayed invisible to the already-warmed
  cache, causing a 404 ("admin API is not reachable") until a manual `cache:clear`.

## [1.3.0] - 2026-07-17

### Added
- Console command **`scale:videooptimizer:uninstall`** — the counterpart to install: drops the
  `vo_settings` table (confirmation-gated, or `--force`) and removes the route import and admin-JS
  wiring. Supports `--dry-run`.
- **Bundle configuration**: `api_base_url` and `embed_base_url` can be overridden under the
  `scale_video_optimizer` config key (e.g. to point at a staging API) instead of being hard-coded.
- Tests for the token cipher, the settings manager and the install command (71 tests total).
- `SECURITY.md` and `CONTRIBUTING.md`.

## [1.2.0] - 2026-07-17

### Added
- Console command **`scale:videooptimizer:install`** that automates the post-`composer require` setup:
  it imports the admin API routes, wires the (pre-compiled) admin JS into `assets/admin`
  (`package.json` dependency + `app.js` import), and creates the `vo_settings` table. Idempotent and
  safe to re-run; `--dry-run` previews the changes. Install shrinks to: register the bundle → run the
  command → `npm run build` → set the token.

## [1.1.0] - 2026-07-17

### Changed
- The admin JS now ships **pre-compiled** (`src/Resources/js/dist`, built with Babel mirroring Sulu's
  config). Installing a project's admin frontend no longer needs the `webpack.config.js` babel-exclude
  edit — only the `assets/admin/package.json` dependency and the `app.js` import remain (install step 5).
  Verified end-to-end in a real Sulu 3.0 admin (all views render, no console errors). CI rebuilds the
  compiled output and fails if the committed `dist/` is stale.

## [1.0.2] - 2026-07-17

### Changed
- The bundle now passes PHPStan at level max; static analysis runs in CI. No runtime behaviour change.

### Documentation
- The bundled Symfony Flex recipe is framed as optional and unpublished; the manual install steps are
  the supported path.

## [1.0.1] - 2026-07-17

### Fixed
- The showcase page template broke Sulu's live preview with "The `{% block content %}`
  could not be found in the twig template." Its editable region is now wrapped in a
  `{% block content %}`, which the preview renderer replaces while editing. Blocks render
  correctly in both preview and the published page.

## [1.0.0] - 2026-07-17

First stable release — the public API (field type, block types, Twig helpers, stored value shape) is
considered stable, so `^1.0` receives all future features and fixes.

### Added
- Ready-to-use **"VideoOptimizer showcase" page template**, shipped by the bundle and registered
  automatically (no file copying): it comes with all four content blocks pre-wired and a self-contained
  view that pulls in the bundle assets, so a project can create a page, add blocks and immediately see
  what they do. Run `bin/console assets:install` once beforehand.

## [0.3.0] - 2026-07-17

### Added
- Remove the stored API token from the admin: a "Remove token" action on the
  Settings page (with a confirmation dialog) clears it server-side.
- Symfony Flex recipe (under `.recipe/`) that registers the bundle and imports
  the admin routes automatically once merged into `symfony/recipes-contrib`.

### Changed
- The Settings form always renders now, even when the initial load fails (e.g. a
  fresh or misconfigured install) — the token can always be entered.
- Views show an actionable message instead of a raw error: a "configure your
  token" hint when none is set (HTTP 428), and an install hint pointing at the
  route import when the admin API is unreachable (HTTP 404).

### Documentation
- Document the required admin-frontend wiring (register the bundle JS in
  `assets/admin/package.json`, import it in `app.js`, and widen the
  `webpack.config.js` babel exclude). Without it the navigation shows but its
  views won't open on a plain `composer require` install.
- Add a Troubleshooting section and a Symfony Flex section to the README.

## [0.2.0] - 2026-07-17

### Added
- Encoding options endpoint (`GET /encodings`) in the client and admin: the
  library cockpit presents codecs and resolutions as labelled chips sourced
  from the endpoint, constrained to each library's `available_codecs` /
  `available_resolutions`, with locked paid add-ons shown greyed and badged.
- Upload a video file directly from the Videos view through a Sulu-style
  "upload file" toolbar button (enabled once a library folder is selected);
  the URL ingest stays available inline.
- Video management from the admin: pick a thumbnail from the auto-generated
  options, upload a custom poster, edit title and player options, or delete
  a video — via a shared management panel reused across views.
- Remote-URL ingest: add a video to a library by URL instead of a file
  upload, proxied server-side.
- Dedicated Videos admin view, plus the same management panel surfaced
  directly inside the selection overlay.
- Library cockpit: video count, storage usage, encoding ladder and a
  reprocess action per library.
- Per-block player choice: render the hosted iframe embed or a native
  HTML5 `<video>` player, with lazy/deferred loading for the native player
  (no eager fetch or autoplay off-screen, respects reduced-motion).
- Per-block `muted` player option (media split, spotlight, video grid).
- Global default player setting (hosted/native); blocks default to `inherit`
  and resolve against it.
- Browse a library's videos as folder tiles, like Sulu media collections: the
  Videos view and the selection overlay list all videos across libraries and
  filter to a library on folder click. The Videos view uses the full width.
- Pick a custom poster from the Sulu media library (image is uploaded to the
  VideoOptimizer), in addition to uploading a file from disk.

### Changed
- Libraries admin view redesigned to match the Sulu media layout: libraries as
  a folder-tile rail on top (with a "new library" tile), a full-width divider,
  then the selected library's cockpit below. Create and edit happen inline;
  delivery-only libraries (`media_managed: false`) show their ladder read-only
  and hide reprocess/upload. Free-text codec/resolution inputs replaced by the
  chip pickers.
- Load videos through the consolidated `GET /videos` endpoint (server-resolved
  cursor pagination, optional `library_id` filter) instead of a per-library
  fan-out.
- VideoOptimizer is a top-level navigation section; its entries are ordered
  Videos, Libraries, Settings.
- The media selection overlay uses the form's locale (or the user's content
  locale in the standalone view) instead of a fixed locale.
- The video detail view shows the selected poster with a play button — updating
  live when you switch thumbnails — and embeds the actual player on click,
  instead of a static duplicate poster.
- The video detail view shows read-only facts: dimensions, duration, status,
  view count and creation date.
- The settings entity gained a `default_player` column — run
  `doctrine:schema:update` (or a migration) when upgrading.

### Fixed
- Switch back to an uploaded custom poster from the thumbnail strip without
  re-uploading; the remove action stays available whenever a custom poster
  exists.
- Portrait posters and thumbnails are no longer cropped in the admin, and all
  generated thumbnails are shown.
- Admin preview images bust the CDN cache so poster/thumbnail changes are
  reflected immediately (stored value and frontend embed keep the clean URL).
- Uniform video grid in the selection overlay.
- The title field in the video detail view is labelled "Title" instead of the
  plugin name.

## [0.1.0] - 2026-07-14

### Added
- Initial release: `video_optimizer` field type, selection/upload overlay and
  library management for the Sulu 3.0 admin.
- Four content blocks (`vo_media_split`, `vo_background_hero`, `vo_spotlight`,
  `vo_video_grid`) with facade/lightbox/direct presentation modes.
- Encrypted, server-side API token; proxy routes so the browser never sees it.
- Cursor-paginated library/video listing against the VideoOptimizer REST API.
- Presigned multipart upload (`initiate`/`complete`) with direct-to-storage
  part uploads from the browser.
