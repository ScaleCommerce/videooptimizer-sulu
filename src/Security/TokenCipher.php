<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Security;

/**
 * Encrypts the VideoOptimizer API token at rest using libsodium's secretbox.
 * The key is derived from an application secret, so the plain token is never persisted.
 */
class TokenCipher
{
    private string $key;

    public function __construct(string $secret)
    {
        // Derive a fixed 32-byte key from the configured secret.
        $this->key = sodium_crypto_generichash($secret, '', SODIUM_CRYPTO_SECRETBOX_KEYBYTES);
    }

    public function encrypt(string $plain): string
    {
        $nonce = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
        $cipher = sodium_crypto_secretbox($plain, $nonce, $this->key);

        return base64_encode($nonce . $cipher);
    }

    public function decrypt(string $encoded): ?string
    {
        $decoded = base64_decode($encoded, true);
        if (false === $decoded || \strlen($decoded) < SODIUM_CRYPTO_SECRETBOX_NONCEBYTES) {
            return null;
        }

        $nonce = substr($decoded, 0, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
        $cipher = substr($decoded, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);

        $plain = sodium_crypto_secretbox_open($cipher, $nonce, $this->key);

        return false === $plain ? null : $plain;
    }
}
