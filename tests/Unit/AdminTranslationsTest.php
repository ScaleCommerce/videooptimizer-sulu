<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Tests\Unit;

use PHPUnit\Framework\TestCase;

/**
 * Every admin string must exist in English and German, and every key the admin JS uses must be defined.
 */
final class AdminTranslationsTest extends TestCase
{
    private const KEY = '/scale_videooptimizer\.[a-z0-9_]+/';

    /**
     * @return array<string, string>
     */
    private static function load(string $locale): array
    {
        $path = \dirname(__DIR__, 2) . '/src/Resources/translations/admin.' . $locale . '.json';
        self::assertFileExists($path);
        $decoded = json_decode((string) file_get_contents($path), true, 512, \JSON_THROW_ON_ERROR);
        self::assertIsArray($decoded);

        /** @var array<string, string> $decoded */
        return $decoded;
    }

    public function testBothLanguagesDefineTheSameKeys(): void
    {
        $en = array_keys(self::load('en'));
        $de = array_keys(self::load('de'));

        self::assertSame([], array_values(array_diff($en, $de)), 'Missing in admin.de.json');
        self::assertSame([], array_values(array_diff($de, $en)), 'Missing in admin.en.json');
    }

    public function testNoTranslationIsEmpty(): void
    {
        foreach (['en', 'de'] as $locale) {
            foreach (self::load($locale) as $key => $value) {
                self::assertNotSame('', trim($value), $locale . ': ' . $key);
            }
        }
    }

    public function testEveryKeyUsedByTheAdminJsIsDefined(): void
    {
        $defined = self::load('en');
        $used = [];
        $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator(\dirname(__DIR__, 2) . '/src/Resources/js', \FilesystemIterator::SKIP_DOTS));
        foreach ($iterator as $file) {
            \assert($file instanceof \SplFileInfo);
            $path = $file->getPathname();
            if ('js' !== $file->getExtension() || str_contains($path, '/dist/') || str_contains($path, '/node_modules/')) {
                continue;
            }
            preg_match_all(self::KEY, (string) file_get_contents($path), $matches);
            foreach ($matches[0] as $key) {
                // Keys assembled at runtime end in an underscore (e.g. 'option_' + name).
                if (!str_ends_with($key, '_')) {
                    $used[$key] = basename($path);
                }
            }
        }

        $missing = array_diff_key($used, $defined);
        self::assertSame([], $missing, 'Used by the admin JS but not defined in admin.en.json');
    }
}
