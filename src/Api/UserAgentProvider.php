<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Api;

use Composer\InstalledVersions;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Builds the User-Agent the bundle sends with every VideoOptimizer API request, so the
 * VideoOptimizer app can show which plugin versions an organization runs:
 *
 *     VideoOptimizer-Sulu/1.8.0 (Sulu 3.0.7; PHP 8.3.14; +https://www.example.com)
 *
 * The VideoOptimizer app parses this with a regex — keep the format stable. Comment parts are
 * separated by "; ", every value is sanitized, empty parts are omitted.
 */
class UserAgentProvider
{
    public const PRODUCT = 'VideoOptimizer-Sulu';
    public const PACKAGE = 'scalecommerce/videooptimizer-sulu';
    public const SULU_PACKAGE = 'sulu/sulu';
    private const MAX_PART_LENGTH = 100;
    private const LOOPBACK_HOSTS = ['localhost', '127.0.0.1', '[::1]', '::1'];

    /** @var \Closure(string): ?string */
    private \Closure $versionLookup;

    /** @var array{plugin: string, sulu: ?string, php: string}|null */
    private ?array $staticParts = null;

    private ?string $configuredSiteUrl;

    /**
     * @param string|null                    $configuredSiteUrl the installation's public base URL, e.g. Symfony's
     *                                                          `framework.router.default_uri`; loopback hosts (the
     *                                                          skeleton default `http://localhost`) are ignored
     * @param (\Closure(string): ?string)|null $versionLookup     returns the pretty version of a Composer package (tests)
     */
    public function __construct(
        private ?RequestStack $requestStack = null,
        ?string $configuredSiteUrl = null,
        ?\Closure $versionLookup = null,
        private string $phpVersion = \PHP_VERSION,
    ) {
        $this->versionLookup = $versionLookup ?? self::installedVersion(...);
        $siteUrl = self::normalizeSiteUrl($configuredSiteUrl);
        $this->configuredSiteUrl = null !== $siteUrl && !self::isLoopback($siteUrl) ? $siteUrl : null;
    }

    public function getUserAgent(): string
    {
        $this->staticParts ??= [
            'plugin' => self::stripVersionPrefix(($this->versionLookup)(self::PACKAGE)) ?? 'unknown',
            'sulu' => self::stripVersionPrefix(($this->versionLookup)(self::SULU_PACKAGE)),
            'php' => $this->phpVersion,
        ];

        return self::format($this->staticParts['plugin'], $this->staticParts['sulu'], $this->staticParts['php'], $this->siteUrl());
    }

    /**
     * Pure formatter: `VideoOptimizer-Sulu/<plugin> (Sulu <sulu>; PHP <php>; +<site url>)`.
     */
    public static function format(string $pluginVersion, ?string $suluVersion, ?string $phpVersion, ?string $siteUrl): string
    {
        $version = str_replace(' ', '', self::sanitize($pluginVersion));

        $parts = [];
        $sulu = str_replace(' ', '', self::sanitize($suluVersion));
        if ('' !== $sulu) {
            $parts[] = 'Sulu ' . $sulu;
        }
        $php = str_replace(' ', '', self::sanitize($phpVersion));
        if ('' !== $php) {
            $parts[] = 'PHP ' . $php;
        }
        $site = str_replace(' ', '', self::sanitize($siteUrl));
        if ('' !== $site) {
            $parts[] = '+' . $site;
        }

        $userAgent = self::PRODUCT . '/' . ('' !== $version ? $version : 'unknown');

        return [] === $parts ? $userAgent : $userAgent . ' (' . implode('; ', $parts) . ')';
    }

    /**
     * Keeps printable ASCII only, drops the comment delimiters `;`, `(`, `)`, collapses whitespace
     * and caps the length, so a value can never break the header or the app's parser.
     */
    public static function sanitize(?string $value): string
    {
        if (null === $value) {
            return '';
        }

        $value = (string) preg_replace('/[^\x20-\x7E]|[;()]/', '', $value);
        $value = trim((string) preg_replace('/ {2,}/', ' ', $value));

        return trim(substr($value, 0, self::MAX_PART_LENGTH));
    }

    /**
     * Configured URL first, else the current main request's scheme + host, else nothing (e.g. CLI).
     */
    private function siteUrl(): ?string
    {
        if (null !== $this->configuredSiteUrl) {
            return $this->configuredSiteUrl;
        }

        $request = $this->requestStack?->getMainRequest();
        if (null === $request) {
            return null;
        }

        try {
            return self::normalizeSiteUrl($request->getSchemeAndHttpHost());
        } catch (\Throwable) {
            // getHost() throws on a malformed/untrusted Host header; identification is best-effort.
            return null;
        }
    }

    /**
     * Reduces a URL to `scheme://host[:port]`; returns null unless it is a http(s) URL with a host.
     */
    private static function normalizeSiteUrl(?string $url): ?string
    {
        if (null === $url || '' === trim($url)) {
            return null;
        }

        $parts = parse_url(trim($url));
        if (!\is_array($parts) || !isset($parts['scheme'], $parts['host']) || '' === $parts['host']) {
            return null;
        }

        $scheme = strtolower($parts['scheme']);
        if ('http' !== $scheme && 'https' !== $scheme) {
            return null;
        }

        return $scheme . '://' . strtolower($parts['host']) . (isset($parts['port']) ? ':' . $parts['port'] : '');
    }

    private static function isLoopback(string $siteUrl): bool
    {
        $host = parse_url($siteUrl, \PHP_URL_HOST);

        return \is_string($host) && \in_array($host, self::LOOPBACK_HOSTS, true);
    }

    private static function stripVersionPrefix(?string $version): ?string
    {
        if (null === $version || '' === $version) {
            return null;
        }

        return (string) preg_replace('/^v(?=\d)/i', '', $version);
    }

    private static function installedVersion(string $package): ?string
    {
        try {
            if (!class_exists(InstalledVersions::class) || !InstalledVersions::isInstalled($package)) {
                return null;
            }

            return InstalledVersions::getPrettyVersion($package);
        } catch (\Throwable) {
            return null;
        }
    }
}
