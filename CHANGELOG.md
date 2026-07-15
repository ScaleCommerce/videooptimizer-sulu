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
