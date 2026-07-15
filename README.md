# scalecommerce/videooptimizer-sulu

> Part of the ScaleCommerce VideoOptimizer plugin family (`scalecommerce/videooptimizer-<platform>`, e.g. `videooptimizer-shopware`).

Integrate **[VideoOptimizer](https://videooptimizer.eu/)** into the [Sulu CMS 3.0](https://sulu.io/) admin.
Editors pick, upload and manage videos directly inside Sulu — without ever logging in to VideoOptimizer.
The organization-wide API token stays on the server (encrypted at rest), so the editorial team never handles credentials.

Published and owned by **ScaleCommerce GmbH** ([scale.sc](https://scale.sc/), [videooptimizer.eu](https://videooptimizer.eu/)).

- Product: **https://videooptimizer.eu/**
- API & developer docs: **https://api.videooptimizer.eu/**

## Why VideoOptimizer? Video delivery via CDN

VideoOptimizer hosts your videos and delivers them through a global **content delivery network (CDN)** with
adaptive streaming. Compared to serving `.mp4` files from your own origin, this is a big win:

- **Fast, global playback** — videos are cached on edge servers near each viewer, so streams start quickly
  (low time-to-first-frame) with minimal buffering, worldwide.
- **Adaptive bitrate (HLS)** — every upload is transcoded into a resolution ladder; the player automatically
  serves the right quality for the viewer's connection and device.
- **Scales under load** — the CDN absorbs traffic spikes, so campaigns or viral pages never overload your CMS origin
  and you avoid origin bandwidth costs on every view.
- **Resilient** — multiple edge locations mean high availability; one node or origin outage doesn't break playback.
- **Effortless for editors** — upload once and posters, thumbnails and renditions are generated automatically; embedding
  is a single lightweight iframe that keeps heavy media off the page's critical path (better Core Web Vitals & SEO).

## Features

- **Content field type `video_optimizer`** for page/snippet/article templates.
- **Selection dialog** in the admin: choose a library, browse videos with thumbnails, and pick one.
- **Upload** from the dialog to VideoOptimizer via presigned multipart (large-file friendly; parts go
  straight to storage from the browser), with automatic processing-status polling.
- **Library management** admin view (create / list / delete).
- **Settings page** to store the organization API token (write-only, encrypted with libsodium).
- **Twig helpers** `video_optimizer_embed()` / `video_optimizer_embed_url()` to render the CDN player.

## Installation

```bash
composer require scalecommerce/videooptimizer-sulu
```

> **Interim: installing from a private GitLab (before the Packagist release).** Add a VCS repository to
> the target project's `composer.json`:
>
> ```json
> "repositories": [
>     { "type": "vcs", "url": "https://gitlab.scale.sc/<group>/videooptimizer-sulu.git" }
> ]
> ```
>
> Create an `auth.json` next to the project's `composer.json` with a GitLab **deploy token**
> (read-only, scope `read_repository`). Never commit it — add `auth.json` to `.gitignore`:
>
> ```json
> {
>     "http-basic": {
>         "gitlab.scale.sc": {
>             "username": "<deploy-token-name>",
>             "password": "<deploy-token>"
>         }
>     }
> }
> ```
>
> Then install:
>
> ```bash
> composer require scalecommerce/videooptimizer-sulu:^0.1
> ```

Register the bundle (if not auto-registered by Symfony Flex) in `config/bundles.php`:

```php
Scale\VideoOptimizerBundle\ScaleVideoOptimizerBundle::class => ['all' => true],
```

Import the admin API routes in `config/routes/sulu_admin.yaml`:

```yaml
scale_videooptimizer_api:
    resource: "@ScaleVideoOptimizerBundle/Resources/config/routing_admin.yaml"
    prefix: /admin/api
```

Create the settings table and build the admin frontend:

```bash
bin/adminconsole doctrine:migrations:migrate
cd assets/admin && npm install && npm run build
```

## Configuration

In the Sulu admin, open **Settings → VideoOptimizer** and paste your `vp_…` API token
(create one in your VideoOptimizer account under Account → API Tokens at https://videooptimizer.eu/).
The token is stored encrypted and never returned to the browser.

## Usage

Add the field to a template (`config/templates/pages/*.xml`):

```xml
<property name="video" type="video_optimizer">
    <meta>
        <title lang="en">Video</title>
    </meta>
</property>
```

Render the CDN player in Twig:

```twig
{% if content.video and content.video.uuid %}
    {{ video_optimizer_embed(content.video, content.title) }}
{% endif %}
```

The stored value is `{ uuid, libraryId, title, posterUrl }`; the embed points at
`https://videooptimizer.eu/embed/<uuid>`.

## Content blocks

Beyond the single `video_optimizer` field, the bundle ships four ready-to-use **Sulu content blocks**
for building richer video-driven pages, each delivered as an XML template fragment plus a matching Twig view:

| Block type          | Purpose                                              | Twig view                          |
|----------------------|-------------------------------------------------------|-------------------------------------|
| `vo_media_split`     | Video beside text, `side` left/right                  | `blocks/vo_media_split.html.twig`   |
| `vo_background_hero` | Full-bleed native `<video>` HLS background            | `blocks/vo_background_hero.html.twig` |
| `vo_spotlight`       | Poster image that opens the video in a lightbox        | `blocks/vo_spotlight.html.twig`     |
| `vo_video_grid`      | Repeatable grid of videos, each opening a lightbox      | `blocks/vo_video_grid.html.twig`    |

### Pulling the blocks into a template

The template fragments live under `src/Resources/config/templates/blocks/` and are pulled into a host
page/snippet template via **XInclude** — no copy-paste needed. The root `<template>` element needs the
`xmlns:xi` namespace declaration; each block type is then a one-line include. From the demo's
`config/templates/pages/showcase.xml`:

```xml
<template xmlns="http://schemas.sulu.io/template/template"
          xmlns:xi="http://www.w3.org/2001/XInclude"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://schemas.sulu.io/template/template http://schemas.sulu.io/template/template-1.0.xsd">
    ...
    <block name="blocks" default-type="intro" minOccurs="0">
        <types>
            <type name="intro">...</type>
            <xi:include href="../../../vendor/scalecommerce/videooptimizer-sulu/src/Resources/config/templates/blocks/media_split.xml"/>
            <xi:include href="../../../vendor/scalecommerce/videooptimizer-sulu/src/Resources/config/templates/blocks/background_hero.xml"/>
            <xi:include href="../../../vendor/scalecommerce/videooptimizer-sulu/src/Resources/config/templates/blocks/spotlight.xml"/>
            <xi:include href="../../../vendor/scalecommerce/videooptimizer-sulu/src/Resources/config/templates/blocks/video_grid.xml"/>
        </types>
    </block>
</template>
```

The `href` paths are relative to the host template file — adjust the `../../../vendor/...` prefix if your
template lives at a different depth. Symfony's XML config loader resolves the includes at template-parse
time, so the merged schema is validated as a whole (confirmed via `sulu:build dev` schema validation — no
fallback to copy-pasted `<type>` blocks was needed).

### Registering assets

The block views need bundle CSS/JS that Sulu publishes like any other bundle asset:

```bash
bin/console assets:install
```

Then reference the published files in the site's base layout:

```twig
<link rel="stylesheet" href="{{ asset('bundles/scalevideooptimizer/css/vo-blocks.css') }}">
<script src="{{ asset('bundles/scalevideooptimizer/js/vo-blocks.js') }}" defer></script>
```

Wrap the rendered blocks in a container with `data-vo-base` — `vo-blocks.js` reads this attribute to
locate the bundled `hls.light.min.js` (only loaded once, even with several `vo_background_hero` blocks
on the same page):

```twig
<div class="vo-blocks" data-vo-base="{{ asset('bundles/scalevideooptimizer/') }}">
    {# ...blocks... #}
</div>
```

### Website Twig dispatch

Each block in `content.blocks` carries its `type`; dispatch to the matching view from the
`@ScaleVideoOptimizer` Twig namespace (auto-registered from the bundle's `Resources/views`):

```twig
{% for block in content.blocks %}
    {% include '@ScaleVideoOptimizer/blocks/' ~ block.type ~ '.html.twig' with { block: block } only %}
{% endfor %}
```

### Theme customization

`vo-blocks.css` scopes all block styling under `.vo-blocks` via CSS custom properties, so a host theme
can override the look without touching the bundle's CSS:

| Property           | Purpose                          |
|---------------------|-----------------------------------|
| `--vo-accent`       | Accent color (links, controls)    |
| `--vo-text`         | Primary text color                |
| `--vo-muted`        | Secondary/muted text color        |
| `--vo-bg`           | Block background color            |
| `--vo-surface`      | Card/surface background color     |
| `--vo-radius`       | Corner radius for cards/media     |
| `--vo-gap`          | Vertical rhythm between sections  |
| `--vo-max-width`    | Max content width                 |
| `--vo-overlay`      | Gradient overlay on media/hero    |
| `--vo-shadow`       | Drop shadow for cards/media       |
| `--vo-font`         | Font family (defaults to `inherit`) |

## Development

### Tests

```bash
composer install
vendor/bin/phpunit
```

### Admin UI

The admin UI lives under `src/Resources/js` (React 17 + MobX, built by Sulu's webpack in the host project).
When developing the bundle inside a host project via a Composer **path repository**, npm copies that JS into
the host's `node_modules` rather than symlinking it — so after editing, refresh the copy before rebuilding:

```bash
rm -rf assets/admin/node_modules/videooptimizer-sulu \
  && cp -r vendor/scalecommerce/videooptimizer-sulu/src/Resources/js assets/admin/node_modules/videooptimizer-sulu \
  && (cd assets/admin && npm run build)
```

State mutations in admin field/view handlers must be wrapped in MobX `@action` (the Sulu production build enforces actions).
