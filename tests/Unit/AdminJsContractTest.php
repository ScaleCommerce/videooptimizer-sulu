<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Tests\Unit;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Source-level contract for the admin JS (no JS runner in this bundle): pins decisions that fail
 * silently when lost. The compiled copy in dist/ must carry them too.
 */
final class AdminJsContractTest extends TestCase
{
    private static function read(string $relative): string
    {
        $path = \dirname(__DIR__, 2) . '/src/Resources/js/' . $relative;
        self::assertFileExists($path);

        return (string) \file_get_contents($path);
    }

    /**
     * @return iterable<string, array{string}>
     */
    public static function roots(): iterable
    {
        yield 'source' => [''];
        yield 'dist' => ['dist/'];
    }

    #[DataProvider('roots')]
    public function testPartsUploadIsAbortable(string $root): void
    {
        $api = self::read($root . 'services/api.js');
        self::assertMatchesRegularExpression('/signal/', $api);
        self::assertMatchesRegularExpression('/method:\s*[\'"]PUT[\'"],\s*body:\s*blob,\s*signal/', $api);
    }

    #[DataProvider('roots')]
    public function testViewsAbortUploadsAndSkipCompleteAfterAbort(string $root): void
    {
        foreach (['fields/VideoSelectionOverlay.js', 'views/Videos.js'] as $file) {
            $code = self::read($root . $file);
            self::assertStringContainsString('new AbortController()', $code, $file);
            self::assertStringContainsString('componentWillUnmount', $code, $file);
            self::assertMatchesRegularExpression('/signal\.aborted/', $code, $file);
            self::assertMatchesRegularExpression('/uploadParts\)?\([^)]*controller\.signal\)/', $code, $file);
            self::assertSame(1, preg_match('/completeUpload\)?\(\{/', $code, $m, \PREG_OFFSET_CAPTURE), $file);
            self::assertLessThan(
                $m[0][1],
                (int) strpos($code, 'signal.aborted'),
                $file . ': abort must be checked before completeUpload.',
            );
        }
        self::assertStringContainsString('abortUpload', self::read($root . 'fields/VideoSelectionOverlay.js'));
    }

    #[DataProvider('roots')]
    public function testPosterContentTypeFallsBackToMediaMimeTypeAndExtension(string $root): void
    {
        $api = self::read($root . 'services/api.js');
        self::assertStringContainsString('posterContentType', $api);
        self::assertStringContainsString('mimeType', $api);
        self::assertMatchesRegularExpression('/webp/', $api);
        self::assertMatchesRegularExpression('/posterContentType\)?\(blob\.type, media\)/', self::read($root . 'components/VideoDetail.js'));
    }
}
