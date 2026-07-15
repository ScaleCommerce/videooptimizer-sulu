# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
