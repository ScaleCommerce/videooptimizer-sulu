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

    /** Der Klassen-Selektor des Bundles — der Pfad, den bestehende Consumer schon haben. */
    private const KLASSE = '.vo-bg-hero__video[data-hls]';

    /** Der Opt-in-Haken fuer fremdes Markup. */
    private const HAKEN = 'video[' . self::MARKER . '][data-hls]';

    /**
     * Das Kriterium fuer "auf alle Videos verbreitert" — ein Element-Selektor, dem KEIN
     * Klassen-/ID-/Bezeichnerzeichen vorangeht. Es steht hier genau einmal, damit die
     * Zusicherung und ihr Anker nachweislich dasselbe pruefen; zwei Kopien koennten
     * auseinanderlaufen, und dann bezeugt der Anker ein Kriterium, das niemand faehrt.
     */
    private static function verbreitert(string $rumpf): int
    {
        return \preg_match('/(?<![\w.#-])video\[data-hls\]/', $rumpf);
    }

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
            self::KLASSE,
            $rumpf,
            'Der eigene Block-Pfad des Bundles fehlt — das waere eine Regression fuer bestehende Consumer.'
        );
        self::assertStringContainsString(
            self::HAKEN,
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
        self::assertSame(0, self::verbreitert($rumpf), 'Der Selektor wurde auf alle Videos verbreitert. Damit greift '
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

    public function testEinUnsichtbaresHintergrundvideoWirdNichtVerdrahtet(): void
    {
        $rumpf = self::funktion(self::script(), 'initBackgroundVideos');

        // Positivanker am echten Bestand: der Selektor MUSS weiterhin beide Formen finden —
        // ohne ihn sichert der Test nur das Wegfallen ab und wuerde auch gruen bleiben, wenn
        // gar nichts mehr verdrahtet wird.
        self::assertStringContainsString(self::KLASSE, $rumpf, 'Der eigene Block-Pfad ist weg.');
        self::assertStringContainsString(self::HAKEN, $rumpf, 'Der Opt-in-Haken ist weg.');

        self::assertStringContainsString('wireWhenRendered(', $rumpf, 'Die Verdrahtung laeuft '
            . 'nicht mehr ueber die Sichtbarkeitspruefung — ein per CSS abgeschaltetes '
            . 'Hintergrundvideo wuerde wieder streamen, ohne je angezeigt zu werden.');
        self::assertStringNotContainsString('attachHls(', $rumpf, 'initBackgroundVideos() haengt '
            . 'HLS wieder unmittelbar an und umgeht die Pruefung.');
    }

    public function testDieSichtbarkeitspruefungIstKeineViewportPruefung(): void
    {
        $pruefung = self::funktion(self::script(), 'isRendered');

        // "Wird ueberhaupt gerendert" ist etwas anderes als "ist gerade auf dem Schirm". Ein
        // Hintergrundvideo weiter unten auf der Seite IST angezeigt. Wer auf den Viewport
        // abstellt, macht aus einem Bugfix stillschweigend eine Lazy-Loading-Aenderung fuer
        // jeden Consumer — eine Verhaltensaenderung in einem Patch-Release.
        self::assertStringContainsString('getClientRects()', $pruefung);
        foreach (['IntersectionObserver', 'getBoundingClientRect', 'innerHeight', 'scrollY'] as $verboten) {
            self::assertStringNotContainsString($verboten, $pruefung, \sprintf(
                'Die Pruefung benutzt %s — das beantwortet "ist es auf dem Schirm", nicht '
                . '"wird es gerendert".',
                $verboten
            ));
        }
    }

    public function testEinSpaeterSichtbaresVideoWirdNachtraeglichVerdrahtet(): void
    {
        $rumpf = self::funktion(self::script(), 'wireWhenRendered');

        // Eine Pruefung, die nur einmal greift, macht aus der Byte-Ersparnis ein totes Video,
        // sobald jemand das Fenster aufzieht: vorhanden, stumm, keine Meldung.
        self::assertStringContainsString('ResizeObserver', $rumpf, 'Es gibt keinen Beobachter '
            . 'fuer das Sichtbarwerden — ein spaeter eingeblendetes Video bliebe stumm.');
        self::assertStringContainsString('observer.disconnect()', $rumpf, 'Der Beobachter wird '
            . 'nach dem Verdrahten nicht geloest und liefe weiter.');
        self::assertStringContainsString("typeof ResizeObserver !== 'function'", $rumpf,
            'Ohne Rueckfall wuerde ein Browser ohne ResizeObserver gar nichts mehr abspielen — '
            . 'eine verlorene Byte-Ersparnis ist der kleinere Schaden als ein totes Video.');
    }

    public function testDasMessgeraetKannROTWerden(): void
    {
        // ⚠️ Der Anker nimmt den ECHTEN Funktionsrumpf und mutiert ihn — er baut sich keine
        // Beispielzeile aus der Regel. Eine aus der Regel abgeleitete Zeile vergleicht zwei
        // gleich blinde Mengen: sie kann nur bestaetigen, was die Regel ohnehin sagt, und
        // ueberlebt jede Verengung des Kriteriums, die den echten Bestand durchfallen liesse.
        // Genau so ist die erste Fassung dieses Tests entstanden: sie prueft mit einer
        // Teilstring-Suche, waehrend die Zusicherung eine Wortgrenze fuehrt — der Lookbehind
        // wurde nie ausgeuebt.
        $rumpf = self::funktion(self::script(), 'initBackgroundVideos');

        // Kontrolle vor der Kontrolle: eine Mutation, die nichts aendert, beweist nichts.
        $ohneHaken = \str_replace(', ' . self::HAKEN, '', $rumpf);
        self::assertNotSame($rumpf, $ohneHaken, 'Der Haken liess sich nicht entfernen — dann '
            . 'steht er nicht in der erwarteten Form im Selektor, und der Anker misst nichts.');

        $verbreitert = \str_replace(self::KLASSE . ', ' . self::HAKEN, 'video[data-hls]', $rumpf);
        self::assertNotSame($rumpf, $verbreitert, 'Der Selektor liess sich nicht verbreitern — '
            . 'dann steht das Selektor-Paar nicht in der erwarteten Form, und der Anker misst nichts.');

        // Dasselbe Kriterium wie die Zusicherungen, auf den mutierten Bestand.
        self::assertStringNotContainsString(self::HAKEN, $ohneHaken, 'Ohne Haken meldet die '
            . 'Zusicherung trotzdem einen Haken — sie kann nicht rot werden.');
        self::assertSame(1, self::verbreitert($verbreitert), 'Der verbreiterte Selektor loest '
            . 'das Kriterium nicht aus — die Zusicherung kann nicht rot werden.');

        // Und die Gegenrichtung am heilen Bestand: das Kriterium darf den Normalfall NICHT
        // anklagen. Der Klassen-Selektor endet auf derselben Zeichenfolge; eine Teilstring-
        // Suche war hier am heilen Stand rot.
        self::assertSame(0, self::verbreitert($rumpf), 'Das Kriterium klagt den heilen Stand an.');
        self::assertSame(1, \preg_match('/video\[data-hls\]/', self::KLASSE), 'Der Klassen-'
            . 'Selektor enthaelt die Zeichenfolge nicht mehr — dann ist die Wortgrenze im '
            . 'Kriterium gegenstandslos geworden und gehoert geprueft.');

        // Dritte Zusicherung, gleiche Bauform: die Ausnahmen des nativen Pfades.
        $nativ = self::funktion(self::script(), 'initNativePlayers');
        foreach (['.vo-native-holder', 'data-vo-native-autoload'] as $ausnahme) {
            $ohne = \str_replace($ausnahme, 'weg', $nativ);
            self::assertNotSame($nativ, $ohne, \sprintf('%s liess sich nicht entfernen.', $ausnahme));
            self::assertStringNotContainsString($ausnahme, $ohne, \sprintf(
                'Die Zusicherung fuer %s kann nicht rot werden.',
                $ausnahme
            ));
        }
    }
}
