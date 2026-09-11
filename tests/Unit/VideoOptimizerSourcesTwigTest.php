<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Prophecy\PhpUnit\ProphecyTrait;
use Scale\VideoOptimizerBundle\EventListener\AssetInjectionListener;
use Scale\VideoOptimizerBundle\Service\SettingsManager;
use Scale\VideoOptimizerBundle\Service\VideoOptimizerEmbedResolver;
use Scale\VideoOptimizerBundle\Twig\VideoOptimizerExtension;
use Twig\Node\Node;

/**
 * `video_optimizer_sources()` hands the resolved sources to a consumer as DATA, for themes whose
 * markup is bound to a design of their own and cannot use the bundle's rendering functions.
 */
class VideoOptimizerSourcesTwigTest extends TestCase
{
    use ProphecyTrait;

    private const RESOLVED = [
        'poster' => 'https://cdn.example.net/poster.jpg',
        'hlsUrl' => 'https://cdn.example.net/master.m3u8',
        'width' => 1920,
        'height' => 1080,
        'duration' => 435,
        'srcset' => 'https://cdn.example.net/poster-800.jpg 800w',
        'theme' => ['accentColor' => '#C72876'],
        'sources' => [
            ['src' => 'https://cdn.example.net/master.m3u8', 'type' => 'application/vnd.apple.mpegurl', 'label' => 'auto'],
            ['src' => 'https://cdn.example.net/720p.mp4', 'type' => 'video/mp4', 'label' => '720p'],
        ],
    ];

    public function testHandsOverEverythingTheResolverKnows(): void
    {
        $out = $this->extension(self::resolved(self::RESOLVED))->sources(['uuid' => 'abc']);

        self::assertIsArray($out);
        self::assertSame('https://cdn.example.net/poster.jpg', $out['poster']);
        self::assertSame('https://cdn.example.net/master.m3u8', $out['hlsUrl']);
        self::assertSame('https://cdn.example.net/poster-800.jpg 800w', $out['srcset']);
        self::assertSame(1920, $out['width']);
        self::assertSame(1080, $out['height']);
        self::assertSame(435, $out['duration']);
        self::assertSame(['accentColor' => '#C72876'], $out['theme']);
    }

    /**
     * The entries are handed over UNCHANGED, key names included. A first draft renamed them to
     * Sulu's media wording (`url`, `mimeType`) for one consumer's convenience; that was rejected,
     * because a translation layer for a single consumer does not belong inside the bundle. This
     * test nails the decision down so the rename cannot creep back in unnoticed.
     */
    public function testSourceEntriesArePassedThroughUnchanged(): void
    {
        $out = $this->extension(self::resolved(self::RESOLVED))->sources(['uuid' => 'abc']);

        self::assertIsArray($out);
        self::assertSame(self::RESOLVED['sources'], $out['sources']);
        self::assertSame(
            ['src' => 'https://cdn.example.net/720p.mp4', 'type' => 'video/mp4', 'label' => '720p'],
            $out['sources'][1]
        );
        self::assertArrayNotHasKey('url', $out['sources'][1]);
        self::assertArrayNotHasKey('mimeType', $out['sources'][1]);
    }

    public function testFallsBackToStoredPosterWhenTheApiHasNone(): void
    {
        // Same behaviour as renderBackground()/renderNative(), so all paths agree on the poster.
        $out = $this->extension(self::resolved())
            ->sources(['uuid' => 'abc', 'posterUrl' => 'https://stored/poster.jpg']);

        self::assertIsArray($out);
        self::assertSame('https://stored/poster.jpg', $out['poster']);
    }

    // Kaputte Quell-Eintraege werden hier ABSICHTLICH nicht geprueft: extractSources() filtert
    // sie an ihrer Quelle heraus, und VideoOptimizerEmbedResolverTest deckt genau das ab
    // (fehlendes `src`, kein Array, leeres `src`). Ein zweiter Test hier wuerde eine Verdopplung
    // festschreiben — und der dazugehoerige Waechter im Code war nach dem deklarierten
    // Rueckgabetyp toter Code, was phpstan zu Recht gemeldet hat.

    public function testReturnsNullWithoutAVideo(): void
    {
        $ext = $this->extension(self::resolved());

        // Same null behaviour as the rendering functions, which return '' here.
        self::assertNull($ext->sources(null));
        self::assertNull($ext->sources(['title' => 'x']));
        self::assertNull($ext->sources(['uuid' => '']));
    }

    public function testSurvivesAResolverThatKnowsNothing(): void
    {
        // getSources() belegt bei einem Netz-/API-Fehler alle Schluessel mit null bzw. [] statt zu
        // werfen (und cached das absichtlich nicht). Genau diese Gestalt wird hier gefuettert.
        $out = $this->extension(self::resolved())->sources(['uuid' => 'abc']);

        self::assertSame(
            ['poster' => null, 'srcset' => null, 'hlsUrl' => null, 'sources' => [],
                'width' => null, 'height' => null, 'duration' => null, 'theme' => null],
            $out
        );
    }

    /**
     * Two properties that are easy to break and would fail silently.
     */
    public function testItIsRegisteredAsDataNotAsMarkup(): void
    {
        $funktionen = [];
        foreach ($this->extension(self::resolved())->getFunctions() as $function) {
            $funktionen[$function->getName()] = $function;
        }

        self::assertArrayHasKey('video_optimizer_sources', $funktionen);

        // No 'is_safe': the return value is an array. Marking it html-safe would be meaningless
        // and would invite `{{ video_optimizer_sources(v) }}` to print an array unescaped.
        self::assertEmpty($funktionen['video_optimizer_sources']->getSafe(new Node()));

        // And it must NOT carry the asset sentinel: there is no markup to carry one. A consumer
        // rendering its own <video> from this data wires the assets itself — this assertion is
        // here so nobody "fixes" that by smuggling the sentinel into a data payload.
        $out = $this->extension(self::resolved(self::RESOLVED))->sources(['uuid' => 'abc']);
        self::assertStringNotContainsString(
            AssetInjectionListener::SENTINEL,
            (string) \json_encode($out)
        );
    }

    /**
     * Die VOLLE Gestalt, die getSources() zusichert — auch in seinem Fehlerzweig, der alle
     * Schluessel mit null/leer belegt statt zu werfen (VideoOptimizerEmbedResolver, getSources()).
     * Tests ueberschreiben nur, was sie meinen; so konstruiert keiner einen Zustand, den der
     * Kontrakt ausschliesst. Der erste Anlauf hier hat genau das getan (`[]` als Rueckgabe) und
     * damit zwei PHP-Warnungen ausgeloest — die Testdaten waren falsch, nicht der Code.
     *
     * @param array<string, mixed> $overrides
     *
     * @return array<string, mixed>
     */
    private static function resolved(array $overrides = []): array
    {
        return \array_merge([
            'poster' => null, 'hlsUrl' => null, 'width' => null, 'height' => null,
            'duration' => null, 'srcset' => null, 'theme' => null, 'sources' => [],
        ], $overrides);
    }

    /**
     * @param array<string, mixed> $resolved
     */
    private function extension(array $resolved): VideoOptimizerExtension
    {
        $resolver = $this->prophesize(VideoOptimizerEmbedResolver::class);
        $resolver->getSources('abc')->willReturn($resolved);

        $settingsManager = $this->prophesize(SettingsManager::class);
        $settingsManager->getDefaultPlayer()->willReturn('hosted');

        return new VideoOptimizerExtension(
            'https://videooptimizer.eu',
            $resolver->reveal(),
            $settingsManager->reveal()
        );
    }
}
