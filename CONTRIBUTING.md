# Contributing

Thanks for helping improve **scalecommerce/videooptimizer-sulu**.

## Getting started

```bash
composer install
vendor/bin/phpunit          # tests
vendor/bin/phpstan analyse  # static analysis (level max)
```

## Admin JS

The admin UI source lives under `src/Resources/js` (React 17 + MobX) and is shipped **pre-compiled** to
`src/Resources/js/dist`. After changing any JS source, rebuild the compiled output and commit it:

```bash
cd src/Resources/js && npm install && npm run build
```

CI verifies `dist/` is in sync with the source, so a stale build fails the pipeline.

## Expectations for a pull request

- `vendor/bin/phpunit` and `vendor/bin/phpstan analyse` pass.
- The committed `src/Resources/js/dist` is up to date if you touched JS.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`).
- Update `CHANGELOG.md` under `## [Unreleased]`.
- Code, comments and commit messages in English.

## Releasing (maintainers)

Tags drive Packagist. Bump the version in `CHANGELOG.md` and `extra.branch-alias` in `composer.json`,
tag `vX.Y.Z`, and push the tag.
