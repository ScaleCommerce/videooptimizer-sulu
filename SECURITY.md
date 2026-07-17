# Security Policy

## Supported versions

The latest `1.x` release receives security fixes.

## Reporting a vulnerability

Please report security issues **privately** — do not open a public issue.

Use GitHub's private vulnerability reporting: on the repository's **Security** tab, choose
**"Report a vulnerability"**. We aim to acknowledge reports within a few working days.

When relevant, include the affected version, a description, and steps to reproduce.

## Handling of the API token

The VideoOptimizer API token is stored encrypted at rest (libsodium `secretbox`, key derived from the
application secret) and is never returned to the browser — all API calls are proxied server-side. If you
believe a change weakens this, please report it via the process above.
