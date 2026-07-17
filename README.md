<div align="center">

# 🎬 VideoOptimizer for Sulu

**Pick, upload and manage CDN-delivered videos — right inside the Sulu admin.**
No separate VideoOptimizer login. No credentials in the browser. Just video.

[![CI](https://github.com/ScaleCommerce/videooptimizer-sulu/actions/workflows/ci.yml/badge.svg)](https://github.com/ScaleCommerce/videooptimizer-sulu/actions/workflows/ci.yml)
[![Latest Version](https://img.shields.io/packagist/v/scalecommerce/videooptimizer-sulu.svg)](https://packagist.org/packages/scalecommerce/videooptimizer-sulu)
[![PHP](https://img.shields.io/badge/php-%E2%89%A5%208.2-777bb4.svg?logo=php&logoColor=white)](https://www.php.net/)
[![Sulu](https://img.shields.io/badge/Sulu-3.0-52b1e8.svg)](https://sulu.io/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

[Product](https://videooptimizer.eu/) · [API & docs](https://api.videooptimizer.eu/) · [Report a bug](https://github.com/ScaleCommerce/videooptimizer-sulu/issues)

</div>

---

Give your editorial team adaptive, CDN-streamed video without ever leaving Sulu. This bundle adds a
**`video_optimizer` content field**, a **selection & upload dialog**, **library management**, and four
**ready-to-use content blocks** to the Sulu 3.0 admin — while the organization's API token stays on the
server, encrypted at rest. Editors just pick a video and hit publish.

> Built and maintained by **[ScaleCommerce GmbH](https://scale.sc/)**, the team behind
> [VideoOptimizer](https://videooptimizer.eu/). Part of the `scalecommerce/videooptimizer-<platform>`
> plugin family.

<div align="center">

![Videos view in the Sulu admin — libraries as folder tiles and videos as a thumbnail grid](https://raw.githubusercontent.com/ScaleCommerce/videooptimizer-sulu/main/docs/screenshots/videos-grid.jpg)

<sub>Browse videos right inside Sulu — libraries as folder tiles, videos as a thumbnail grid. <i>(Thumbnails and titles blurred/renamed for the demo.)</i></sub>

</div>

## ✨ Highlights

- 🎥 **`video_optimizer` field type** — drop it into any page, snippet or article template.
- 🗂️ **Media-style admin** — browse libraries as folder tiles, videos as a thumbnail grid, with title search and a "ready only" filter.
- ⬆️ **Big-file uploads** — presigned multipart upload straight from the browser to storage, with live processing status. Or ingest from a remote URL.
- 🖼️ **Full asset control** — pick auto-generated thumbnails, upload a custom poster (from disk or the Sulu media library), edit titles and player options, delete videos.
- 🧱 **Four content blocks** — `media split`, `background hero`, `spotlight` and a `video grid`, with facade / lightbox / direct presentation modes.
- 🔐 **Token never touches the browser** — stored server-side, encrypted with libsodium; all API calls are proxied.
- ⚡ **Core-Web-Vitals friendly** — lazy poster loading, `IntersectionObserver`-gated players, `above-the-fold` priority hint, and a single lightweight embed per video.
- 🌍 **Global CDN delivery** — adaptive-bitrate HLS, edge-cached worldwide, resilient under traffic spikes.

<details>
<summary><b>Why deliver video through VideoOptimizer's CDN?</b></summary>

Compared to serving `.mp4` files from your own origin:

- **Fast, global playback** — cached on edge servers near each viewer, so streams start quickly with minimal buffering, worldwide.
- **Adaptive bitrate (HLS)** — every upload is transcoded into a resolution ladder; the player serves the right quality for the connection and device.
- **Scales under load** — the CDN absorbs traffic spikes, so campaigns or viral pages never overload your CMS origin, and you avoid origin bandwidth costs on every view.
- **Resilient** — multiple edge locations mean high availability; one node or origin outage doesn't break playback.
- **Effortless for editors** — upload once and posters, thumbnails and renditions are generated automatically; embedding is a single lightweight iframe that keeps heavy media off the page's critical path (better Core Web Vitals & SEO).

</details>

<div align="center">

![Library cockpit with the encoding ladder as codec and resolution chips](https://raw.githubusercontent.com/ScaleCommerce/videooptimizer-sulu/main/docs/screenshots/library-cockpit.jpg)

<sub>Library cockpit: manage the encoding ladder as codec/resolution chips, with paid add-ons clearly flagged.</sub>

</div>

## Requirements

| | |
|---|---|
| PHP | ≥ 8.2 with `ext-sodium` |
| Sulu | ^3.0 |
| Symfony | ^6.4 \|\| ^7.0 |
| A VideoOptimizer account | grab an API token at [videooptimizer.eu](https://videooptimizer.eu/) → Account → API Tokens |

## 🚀 Quick start

**TL;DR** (with Symfony Flex, which registers the bundle for you):

```bash
composer require scalecommerce/videooptimizer-sulu
bin/adminconsole scale:videooptimizer:install        # routes + admin JS + settings table + cache
(cd assets/admin && npm install && npm run build)    # build the admin frontend
```

Then open **Settings → VideoOptimizer** in the admin and paste your API token. That's it. The detailed
steps follow.

---

**1. Install**

```bash
composer require scalecommerce/videooptimizer-sulu
```

**2. Register the bundle.** Symfony Flex does this automatically on `composer require`. Only if you run
without Flex, add it to `config/bundles.php` yourself:

```php
Scale\VideoOptimizerBundle\ScaleVideoOptimizerBundle::class => ['all' => true],
```

**3. Run the installer.** The bundle ships a console command that does the steps a plain
`composer require` cannot — it imports the admin API routes, wires its (pre-compiled) admin JS into
`assets/admin`, creates the settings table, and clears the cache so the routes are served right away:

```bash
bin/adminconsole scale:videooptimizer:install
```

It is idempotent (safe to re-run) and only fills in what's missing; add `--dry-run` to preview.

<details>
<summary>What it does — or set it up by hand instead</summary>

- **Admin API routes** — creates `config/routes/scale_videooptimizer_admin.yaml`:

  ```yaml
  scale_videooptimizer_api:
      resource: "@ScaleVideoOptimizerBundle/Resources/config/routing_admin.yaml"
      prefix: /admin/api
  ```

- **Admin JS wiring** — adds the dependency to `assets/admin/package.json` and imports it in
  `assets/admin/app.js` (the JS ships pre-compiled, so no `webpack.config.js` change is needed):

  ```json
  "videooptimizer-sulu": "file:../../vendor/scalecommerce/videooptimizer-sulu/src/Resources/js"
  ```
  ```js
  import 'videooptimizer-sulu';
  ```

- **Settings table** — creates `vo_settings` from the `VideoOptimizerSettings` entity. If your team
  tracks schema through migrations, run `bin/adminconsole doctrine:migrations:diff` then `:migrate`
  instead.

</details>

**4. Build the admin frontend:**

```bash
cd assets/admin && npm install && npm run build
```

> After updating the bundle, hard-reload the admin (the build hash changes) so the browser doesn't run
> the stale bundle.

**5. Add your token.** In the Sulu admin, open **Settings → VideoOptimizer** and paste your `vp_…` API
token. It's stored encrypted and never returned to the browser. Done — editors can now pick videos. 🎉

<div align="center">

![VideoOptimizer settings page with the write-only, encrypted API token field](https://raw.githubusercontent.com/ScaleCommerce/videooptimizer-sulu/main/docs/screenshots/settings.jpg)

<sub>One organization-wide token, stored encrypted server-side — the write-only field never echoes it back.</sub>

</div>

**6. See the blocks in action (optional).** Run `bin/console assets:install`, then create a page with the
**"VideoOptimizer showcase"** template (shipped by the bundle, no setup) — it already has all four
content blocks wired up and renders them on a self-contained page. See [Content blocks](#-content-blocks).

> **Optional:** a [Symfony Flex recipe](#optional-zero-config-install-with-symfony-flex) is included that
> can register the bundle (step 2) automatically.

## Optional: zero-config install with Symfony Flex

A [Symfony Flex](https://symfony.com/doc/current/setup/flex.html) recipe is included in the repository
under [`.recipe/`](.recipe/). It is **not published** to
[`symfony/recipes-contrib`](https://github.com/symfony/recipes-contrib) — the steps above are the
supported path. If you want a Flex-enabled project to register the bundle in `config/bundles.php` and
import the admin routes on `composer require`, you can submit the recipe yourself; see
[`.recipe/README.md`](.recipe/README.md). The `scale:videooptimizer:install` command still handles the
admin JS wiring and the settings table.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| The **VideoOptimizer navigation appears but clicking does nothing** / no view opens | The admin JS was not wired into the build | Run `bin/adminconsole scale:videooptimizer:install`, then `cd assets/admin && npm run build`, then hard-reload the admin |
| Views open but show **"…admin API is not reachable (404)"** | The proxy routes are not imported (or the cache is stale) | Run `bin/adminconsole scale:videooptimizer:install` — it imports the routes and clears the cache. (If it still 404s, run `bin/adminconsole cache:clear`.) |
| A view says **"No VideoOptimizer token is configured yet"** | No API token stored | Open **Settings → VideoOptimizer** and save your `vp_…` token |
| Settings shows an error but the form is still usable | Expected on a fresh/misconfigured install — the form never blocks so you can always enter the token | Enter the token and save; fix routes if the error mentions 404 |

## Upgrading

```bash
composer update scalecommerce/videooptimizer-sulu
```

Then, because the admin is compiled and its translations are cached, refresh both:

```bash
cd assets/admin && npm run build          # rebuild so new admin views/labels ship
bin/adminconsole cache:clear              # pick up new translations
```

Hard-reload the admin afterwards (the build hash changes). Because this package follows semantic
versioning, `^1.0` receives every 1.x feature and fix automatically.

## Configuration (optional)

The API and embed base URLs default to VideoOptimizer's production hosts. Override them (e.g. to point
at a staging API) under the `scale_video_optimizer` key:

```yaml
# config/packages/scale_video_optimizer.yaml
scale_video_optimizer:
    api_base_url: 'https://api.videooptimizer.eu/api/v1'
    embed_base_url: 'https://videooptimizer.eu'
```

## Uninstalling

```bash
bin/adminconsole scale:videooptimizer:uninstall   # add --force to skip the drop-table confirmation
```

Removes the route import and admin-JS wiring and drops the `vo_settings` table (which holds the
encrypted token, so it asks for confirmation first; `--dry-run` previews). Afterwards remove the bundle
from `config/bundles.php` and run `composer remove scalecommerce/videooptimizer-sulu`.

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

## 🧱 Content blocks

Beyond the single field, the bundle ships four ready-to-use **Sulu content blocks** for richer
video-driven pages — each delivered as an XML template fragment plus a matching Twig view, so there's
nothing to copy-paste.

| Block type          | Purpose                                          | Twig view                             |
|----------------------|--------------------------------------------------|----------------------------------------|
| `vo_media_split`     | Video beside text, `side` left/right             | `blocks/vo_media_split.html.twig`      |
| `vo_background_hero` | Full-bleed native `<video>` HLS background        | `blocks/vo_background_hero.html.twig`  |
| `vo_spotlight`       | Poster that opens the video in a lightbox         | `blocks/vo_spotlight.html.twig`        |
| `vo_video_grid`      | Repeatable grid of videos, each opening a lightbox | `blocks/vo_video_grid.html.twig`       |

### Fastest path: the shipped showcase template

The bundle ships a ready-to-use **"VideoOptimizer showcase"** page template with all four blocks already
wired in and a self-contained view. It is **registered automatically** — nothing to copy. After
`bin/console assets:install`, pick it when creating a page, add blocks, publish, and you're done.

Use this to explore the blocks immediately, or as a reference for wiring them into your own templates
(below).

### Wiring blocks into your own templates

Prefer your own theme/template? Pull the block fragments in via XInclude:

<details>
<summary><b>Show the XInclude setup</b></summary>

The template fragments live under `src/Resources/config/templates/blocks/` and are pulled into a host
page/snippet template via **XInclude** — no copy-paste. The root `<template>` element needs the
`xmlns:xi` namespace declaration; each block type is then a one-line include:

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
time, so the merged schema is validated as a whole.

</details>

<details>
<summary><b>Registering assets & Twig dispatch</b></summary>

Publish the bundle's CSS/JS like any other bundle asset:

```bash
bin/console assets:install
```

Reference the published files in your base layout, and wrap the blocks in a container with `data-vo-base`
(`vo-blocks.js` reads it to locate the bundled `hls.light.min.js`, loaded once per page):

```twig
<link rel="stylesheet" href="{{ asset('bundles/scalevideooptimizer/css/vo-blocks.css') }}">
<script src="{{ asset('bundles/scalevideooptimizer/js/vo-blocks.js') }}" defer></script>

<div class="vo-blocks" data-vo-base="{{ asset('bundles/scalevideooptimizer/') }}">
    {% for block in content.blocks %}
        {% include '@ScaleVideoOptimizer/blocks/' ~ block.type ~ '.html.twig' with { block: block } only %}
    {% endfor %}
</div>
```

</details>

<details>
<summary><b>Theming</b></summary>

`vo-blocks.css` scopes all block styling under `.vo-blocks` via CSS custom properties, so a host theme
can restyle everything without touching the bundle's CSS:

| Property         | Purpose                          |
|-------------------|----------------------------------|
| `--vo-accent`     | Accent color (links, controls)   |
| `--vo-text`       | Primary text color               |
| `--vo-muted`      | Secondary/muted text color       |
| `--vo-bg`         | Block background color           |
| `--vo-surface`    | Card/surface background color    |
| `--vo-radius`     | Corner radius for cards/media    |
| `--vo-gap`        | Vertical rhythm between sections |
| `--vo-max-width`  | Max content width                |
| `--vo-overlay`    | Gradient overlay on media/hero   |
| `--vo-shadow`     | Drop shadow for cards/media      |
| `--vo-font`       | Font family (defaults to `inherit`) |

</details>

## 🔐 How it works

The API token is stored **once**, organization-wide, encrypted with libsodium's `secretbox`. Editors
never see or handle it. Every call to VideoOptimizer is proxied through the bundle's admin controllers
so the token stays server-side — the browser only ever receives short-lived **presigned URLs** for the
direct-to-storage part uploads. List endpoints are cursor-paginated and resolved server-side into a flat
array; rate limits (`429`) are retried once, honoring `Retry-After`.

## Development

```bash
composer install
vendor/bin/phpunit
```

<details>
<summary><b>Working on the admin UI</b></summary>

The admin UI source lives under `src/Resources/js` (React 17 + MobX). It is shipped **pre-compiled**
to `src/Resources/js/dist` (via Babel, mirroring Sulu's own config) so consumers don't need to widen
their webpack babel config. **After editing the source, rebuild the compiled output and commit it:**

```bash
cd src/Resources/js && npm install && npm run build   # regenerates dist/
```

CI verifies `dist/` is in sync with the source, so a stale build fails the pipeline. State mutations in
admin field/view handlers must be wrapped in MobX `@action` (the Sulu production build enforces actions).

</details>

## Contributing

Issues and pull requests are welcome at
[github.com/ScaleCommerce/videooptimizer-sulu](https://github.com/ScaleCommerce/videooptimizer-sulu).
Please run `vendor/bin/phpunit` before opening a PR.

## License

Released under the [MIT License](LICENSE), © ScaleCommerce GmbH.

Ships [hls.js](https://github.com/video-dev/hls.js) (Apache License 2.0) for HLS playback in the content
blocks — see [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
