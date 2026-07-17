# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
