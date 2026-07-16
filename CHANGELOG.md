# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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
- Load videos through the consolidated `GET /videos` endpoint (server-resolved
  cursor pagination, optional `library_id` filter) instead of a per-library
  fan-out.
- VideoOptimizer is a top-level navigation section; its entries are ordered
  Videos, Libraries, Settings.
- The media selection overlay uses the form's locale (or the user's content
  locale in the standalone view) instead of a fixed locale.
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
