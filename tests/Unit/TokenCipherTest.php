<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Scale\VideoOptimizerBundle\Security\TokenCipher;

class TokenCipherTest extends TestCase
{
    public function testEncryptDecryptRoundTrip(): void
    {
        $cipher = new TokenCipher('a-strong-application-secret');
        $token = 'vp_1234567890abcdef';

        self::assertSame($token, $cipher->decrypt($cipher->encrypt($token)));
    }

    public function testEncryptUsesAFreshNonceEachTime(): void
    {
        $cipher = new TokenCipher('a-strong-application-secret');

        // Same plaintext, different ciphertext (random nonce) — but both decrypt back.
        self::assertNotSame($cipher->encrypt('vp_token'), $cipher->encrypt('vp_token'));
    }

    public function testDecryptWithAnotherSecretFails(): void
    {
        $encrypted = (new TokenCipher('secret-a'))->encrypt('vp_token');

        self::assertNull((new TokenCipher('secret-b'))->decrypt($encrypted));
    }

    public function testDecryptRejectsGarbage(): void
    {
        $cipher = new TokenCipher('a-strong-application-secret');

        self::assertNull($cipher->decrypt('not-base64-or-cipher'));
        self::assertNull($cipher->decrypt(''));
        self::assertNull($cipher->decrypt(base64_encode('too-short')));
    }
}
