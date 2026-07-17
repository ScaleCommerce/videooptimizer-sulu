# Symfony Flex recipe

Source for the package's [Symfony Flex](https://symfony.com/doc/current/setup/flex.html) recipe. Once
this recipe is merged into [`symfony/recipes-contrib`](https://github.com/symfony/recipes-contrib), a
plain `composer require scalecommerce/videooptimizer-sulu` in a Flex-enabled project applies it
automatically:

- registers the bundle in `config/bundles.php` (**install step 2**), and
- copies `config/routes/scale_videooptimizer_admin.yaml`, which imports the admin proxy routes behind
  the `/admin` firewall (**install step 3** — the `_admin` filename suffix scopes it to Sulu's admin
  context).

The admin-frontend wiring (install step 5) still has to be done by hand — Flex cannot patch
`assets/admin/webpack.config.js`.

## Layout

```
scalecommerce/videooptimizer-sulu/1.0/
├── manifest.json
└── config/routes/scale_videooptimizer_admin.yaml
```

## Submitting

1. Fork `symfony/recipes-contrib`.
2. Copy the `scalecommerce/` tree from here into the fork's root.
3. Open a pull request. CI validates the manifest; a maintainer merges it.

Until the recipe is merged, follow the manual steps in the main README.
