<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Tests\Unit;

use PHPUnit\Framework\TestCase;

/**
 * KONTRAKT-Zusicherung über `vo-blocks.js` — ausdrücklich KEIN Verhaltensnachweis.
 *
 * Was sie leistet: sie liest die ausgelieferte Datei und hält fest, dass der Selektor der
 * HLS-Verdrahtung den Opt-in-Haken für fremdes Markup führt und dass die beiden Ausnahmen des
 * nativen Pfades erhalten bleiben. Was sie NICHT leistet: zu zeigen, dass ein Video spielt. Dafür
 * braucht es einen Browser, und dieser Nachweis gehört zum Consumer (Integrations-Pass,
 * gemessen an `video.currentSrc` und `readyState`).
 *
 * ⚠️ Warum PHP und nicht JS: das Bundle hat keine JS-Testinfrastruktur — kein Wurzel-`package.json`,
 * kein Test-Runner, keine `*.test.js`, und die CI baut nur das Admin-JS. `vo-blocks.js` wird weder
 * gebaut noch getestet. Eine JS-Testumgebung einzuführen ist eine eigene Entscheidung und kein
 * Nebeneffekt dieses Releases; bis dahin ist eine Textprüfung des ausgelieferten Skripts das, was
 * ehrlich zugesichert werden kann — und sie ist mehr wert als gar keine, solange sie sich nicht
 * als etwas anderes ausgibt.
 *
 * Der Anlass: `initBackgroundVideos()` suchte ausschließlich `.vo-bg-hero__video[data-hls]`, also
 * die Klasse des Bundles. Ein Consumer mit eigenem Markup — genau der, für den
 * `video_optimizer_sources()` gebaut wurde — wurde nie gefunden. Das Ergebnis war ein
 * Hintergrundvideo, das lautlos nicht spielt: Poster sichtbar, keine Wiedergabe, keine Meldung.
 */
final class VoBlocksJsContractTest extends TestCase
{
    private const MARKER = 'data-vo-hls';

    private static function script(): string
    {
        $pfad = \dirname(__DIR__, 2) . '/src/Resources/public/js/vo-blocks.js';
        self::assertFileExists($pfad);
        $inhalt = (string) \file_get_contents($pfad);

        // Positivanker für den Leser selbst: findet er die Datei nicht oder ist sie leer, wären
        // alle Zusicherungen unten "grün" über nichts.
        self::assertGreaterThan(1000, \strlen($inhalt), 'vo-blocks.js ist verdaechtig klein.');

        // ⚠️ Kommentare heraus, BEVOR geprueft wird. Der Kontrakt gilt dem Code, nicht der Prosa —
        // und der Kommentar an der geaenderten Stelle nennt die verbotene Selektorform woertlich,
        // um zu erklaeren, warum sie verboten ist. Ohne dieses Abstreifen klagt der Test also
        // seine eigene Begruendung an. Dieselbe Klasse wie der Utility-Leak aus Prosa: jede Datei,
        // die einen Ausdruck NENNT, ist sonst eine Fundstelle.
        $ohneKommentare = \preg_replace('#/\*.*?\*/#s', '', $inhalt);
        $ohneKommentare = \preg_replace('#^\s*//[^\n]*$#m', '', (string) $ohneKommentare);

        return (string) $ohneKommentare;
    }

    /**
     * Schneidet einen Funktionsrumpf heraus — grob über die Einrückung, weil die Datei eine
     * schlichte IIFE mit vier Leerzeichen Einzug ist. Bricht ab, wenn die Funktion fehlt: dann
     * misst der Test etwas anderes als er behauptet.
     */
    private static function funktion(string $script, string $name): string
    {
        $start = \strpos($script, 'function ' . $name . '(');
        self::assertNotFalse($start, \sprintf('Funktion %s() nicht gefunden — der Kontrakt bezieht sich auf sie.', $name));

        $ende = \strpos($script, "\n    }", $start);
        self::assertNotFalse($ende, \sprintf('Ende von %s() nicht gefunden.', $name));

        return \substr($script, $start, $ende - $start);
    }

    public function testDieHintergrundVerdrahtungFindetAuchFremdesMarkup(): void
    {
        $rumpf = self::funktion(self::script(), 'initBackgroundVideos');

        self::assertStringContainsString(
            ".vo-bg-hero__video[data-hls]",
            $rumpf,
            'Der eigene Block-Pfad des Bundles fehlt — das waere eine Regression fuer bestehende Consumer.'
        );
        self::assertStringContainsString(
            'video[' . self::MARKER . '][data-hls]',
            $rumpf,
            'Der Opt-in-Haken fuer fremdes Markup fehlt. Ohne ihn findet die HLS-Verdrahtung nur die '
            . 'Klasse des Bundles, und ein Consumer mit eigenem Markup bekommt ein Video, das '
            . 'lautlos nicht spielt.'
        );
    }

    public function testDerSelektorWirdNichtVerbreitert(): void
    {
        $rumpf = self::funktion(self::script(), 'initBackgroundVideos');

        // Ein Element-Selektor ohne Marker wuerde JEDES Video einsammeln — auch die, die
        // initNativePlayers() bewusst ausnimmt. Der Haken ist ein Opt-in, keine Generalvollmacht.
        //
        // ⚠️ Die Zusicherung braucht eine WORTGRENZE, keine Teilstring-Suche. Der legitime
        // Klassen-Selektor des Bundles endet auf genau derselben Zeichenfolge
        // (…__video, gefolgt vom Attribut), also meldet eine nackte Teilstring-Suche den
        // Normalfall als Defekt. Gemessen: sie war rot am heilen Stand. Der Defekt ist ein
        // Element-Selektor, dem KEIN Klassen-/ID-/Bezeichnerzeichen vorangeht.
        $treffer = \preg_match('/(?<![\w.#-])video\[data-hls\]/', $rumpf);
        self::assertSame(0, $treffer, 'Der Selektor wurde auf alle Videos verbreitert. Damit greift '
            . 'die Hintergrund-Verdrahtung auch auf Facade- und Lazy-Videos zu, die der native '
            . 'Pfad ausnimmt.');
    }

    public function testDerNativePfadBehaeltSeineZweiAusnahmen(): void
    {
        $rumpf = self::funktion(self::script(), 'initNativePlayers');

        foreach (['.vo-native-holder', 'data-vo-native-autoload'] as $ausnahme) {
            self::assertStringContainsString($ausnahme, $rumpf, \sprintf(
                'Die Ausnahme %s ist aus initNativePlayers() verschwunden — Facade- und Lazy-Pfad '
                . 'haengen daran.',
                $ausnahme
            ));
        }
    }

    public function testDerReducedMotionAusstiegStehtVORDerVerdrahtung(): void
    {
        // Der Haken sitzt absichtlich IN initBackgroundVideos() und nicht in einer eigenen
        // Funktion: nur so erbt fremdes Markup diesen Frühausstieg.
        $rumpf = self::funktion(self::script(), 'initBackgroundVideos');

        $motion = \strpos($rumpf, 'prefers-reduced-motion');
        $selektor = \strpos($rumpf, 'querySelectorAll');

        self::assertNotFalse($motion, 'Der prefers-reduced-motion-Ausstieg fehlt.');
        self::assertNotFalse($selektor);
        self::assertLessThan($selektor, $motion, \sprintf(
            'Der prefers-reduced-motion-Ausstieg steht nicht mehr vor der Verdrahtung. Fremdes '
            . 'Markup wuerde ihn dann nicht mehr erben — der Grund, warum der Haken in dieser '
            . 'Funktion sitzt und nicht in einer eigenen.'
        ));
    }

    public function testDasMessgeraetKannROTWerden(): void
    {
        // Ohne diesen Anker koennte das Gruen oben auch heissen, dass die Ausdruecke nie greifen.
        $ohneHaken = "function initBackgroundVideos(baseUrl) {\n"
            . "        if (prefers-reduced-motion) { return; }\n"
            . "        document.querySelectorAll('.vo-bg-hero__video[data-hls]').forEach(f);\n"
            . "\n    }";
        self::assertStringNotContainsString('video[' . self::MARKER . '][data-hls]', $ohneHaken);

        $verbreitert = "document.querySelectorAll('video[data-hls]')";
        self::assertStringContainsString('video[data-hls]', $verbreitert);

        $ohneAusnahmen = "function initNativePlayers(baseUrl) {\n        nichts\n    }";
        self::assertStringNotContainsString('.vo-native-holder', $ohneAusnahmen);
    }
}
