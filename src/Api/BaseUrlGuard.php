<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Api;

/**
 * Defence in depth for the configurable base URLs: https only, no userinfo, query or fragment
 * (request paths are appended verbatim) and no localhost or non-global IP literal, checked on the
 * IDNA-normalised host so the token cannot be pointed at internal services. Host names are not resolved.
 */
final class BaseUrlGuard
{
    /**
     * @throws \InvalidArgumentException when the URL is not acceptable
     */
    public static function assertHttps(string $url, string $label = 'base URL'): void
    {
        $message = \sprintf('The VideoOptimizer %s must be an absolute https URL without credentials, query or fragment, pointing to a public host.', $label);

        $parts = parse_url($url);
        if (false === $parts) {
            throw new \InvalidArgumentException($message);
        }

        $scheme = strtolower((string) ($parts['scheme'] ?? ''));
        $host = strtolower((string) ($parts['host'] ?? ''));
        if ('https' !== $scheme || '' === $host) {
            throw new \InvalidArgumentException($message);
        }
        if (isset($parts['user']) || isset($parts['pass']) || isset($parts['query']) || isset($parts['fragment'])) {
            throw new \InvalidArgumentException($message);
        }

        $host = rtrim($host, '.');
        if (!str_starts_with($host, '[') && \function_exists('idn_to_ascii') && 1 !== preg_match('/^[\x20-\x7e]+$/', $host)) {
            $ascii = idn_to_ascii($host, \IDNA_NONTRANSITIONAL_TO_ASCII, \INTL_IDNA_VARIANT_UTS46);
            if (false === $ascii) {
                throw new \InvalidArgumentException($message);
            }
            $host = rtrim(strtolower($ascii), '.');
        }

        if ('localhost' === $host || str_ends_with($host, '.localhost')) {
            throw new \InvalidArgumentException($message);
        }

        $ip = trim($host, '[]');
        if (false !== filter_var($ip, \FILTER_VALIDATE_IP)) {
            if (false === filter_var($ip, \FILTER_VALIDATE_IP, \FILTER_FLAG_GLOBAL_RANGE)) {
                throw new \InvalidArgumentException($message);
            }

            return;
        }

        // Numeric or hex host forms that resolvers still treat as IPv4 ("2130706433", "127.1", "0x7f000001").
        if (1 === preg_match('/^[0-9.]+$/', $host) || 1 === preg_match('/(^|\.)0x[0-9a-f]*($|\.)/', $host)) {
            throw new \InvalidArgumentException($message);
        }
    }
}
