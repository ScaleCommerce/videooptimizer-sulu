<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Prophecy\PhpUnit\ProphecyTrait;
use Scale\VideoOptimizerBundle\Api\VideoOptimizerClient;
use Scale\VideoOptimizerBundle\Api\VideoOptimizerException;
use Scale\VideoOptimizerBundle\Controller\Admin\SubtitleController;
use Scale\VideoOptimizerBundle\Service\SettingsManager;
use Scale\VideoOptimizerBundle\Service\VideoOptimizerEmbedResolver;
use Symfony\Component\HttpClient\MockHttpClient;
use Symfony\Component\HttpClient\Response\MockResponse;
use Symfony\Component\HttpFoundation\Request;

class SubtitleApiTest extends TestCase
{
    use ProphecyTrait;

    private const UUID = '5c0a1e6e-7d3b-4c2a-9f10-0000000000de';

    /** @var list<array{method: string, url: string, options: array<string, mixed>}> */
    private array $calls = [];

    public function testClientListsSubtitlesOfAVideo(): void
    {
        $client = $this->client(fn () => new MockResponse(json_encode(['data' => [['language' => 'de', 'label' => 'Deutsch', 'kind' => 'subtitles', 'is_default' => true], 'junk']], JSON_THROW_ON_ERROR)));

        self::assertSame([['language' => 'de', 'label' => 'Deutsch', 'kind' => 'subtitles', 'is_default' => true]], $client->listSubtitles(self::UUID));
        self::assertSame('GET', $this->calls[0]['method']);
        self::assertStringEndsWith('/videos/' . self::UUID . '/subtitles', $this->calls[0]['url']);
    }

    public function testClientUploadsASubtitleAsMultipartForm(): void
    {
        $client = $this->client(fn () => new MockResponse(json_encode(['data' => ['subtitle' => ['language' => 'de'], 'skipped_cues' => 1]], JSON_THROW_ON_ERROR)));

        $result = $client->uploadSubtitle(self::UUID, "My \"sub\"\r\ntitle.srt", "1\n00:00:01,000 --> 00:00:02,000\nHallo\n", 'de-CH', 'captions', true);

        self::assertSame(1, $result['skipped_cues']);
        self::assertSame('POST', $this->calls[0]['method']);
        self::assertStringEndsWith('/videos/' . self::UUID . '/subtitles', $this->calls[0]['url']);
        $headers = implode("\n", array_map('strval', (array) $this->calls[0]['options']['headers']));
        self::assertMatchesRegularExpression('/Content-Type: multipart\/form-data; boundary=(\S+)/i', $headers);
        preg_match('/boundary=(\S+)/', $headers, $m);
        $body = (string) $this->calls[0]['options']['body'];
        self::assertStringStartsWith('--' . $m[1] . "\r\n", $body);
        self::assertStringEndsWith('--' . $m[1] . "--\r\n", $body);
        self::assertStringContainsString("name=\"language\"\r\n\r\nde-CH\r\n", $body);
        self::assertStringContainsString("name=\"kind\"\r\n\r\ncaptions\r\n", $body);
        self::assertStringContainsString("name=\"is_default\"\r\n\r\ntrue\r\n", $body);
        self::assertStringContainsString("00:00:01,000 --> 00:00:02,000\nHallo\n", $body);
        // The filename must not be able to break out of the header line.
        self::assertMatchesRegularExpression('/name="file"; filename="[A-Za-z0-9._ -]+"\r\n/', $body);
        self::assertStringNotContainsString("title.srt\"\r\n\"", $body);
    }

    public function testClientOmitsKindAndDefaultWhenNotGiven(): void
    {
        $client = $this->client(fn () => new MockResponse('{"data":{}}'));

        $client->uploadSubtitle(self::UUID, 'a.vtt', "WEBVTT\n", 'en');

        $body = (string) $this->calls[0]['options']['body'];
        self::assertStringNotContainsString('name="kind"', $body);
        self::assertStringNotContainsString('name="is_default"', $body);
    }

    public function testClientDownloadsTheStoredWebVtt(): void
    {
        $client = $this->client(fn () => new MockResponse("WEBVTT\n\n00:00.000 --> 00:01.000\nHi\n", ['response_headers' => ['content-type' => 'text/vtt']]));

        self::assertSame("WEBVTT\n\n00:00.000 --> 00:01.000\nHi\n", $client->downloadSubtitle(self::UUID, 'de'));
        self::assertStringEndsWith('/videos/' . self::UUID . '/subtitles/de', $this->calls[0]['url']);
    }

    public function testClientDeletesASubtitle(): void
    {
        $client = $this->client(fn () => new MockResponse('{"data":{"success":true}}'));

        $client->deleteSubtitle(self::UUID, 'de');

        self::assertSame('DELETE', $this->calls[0]['method']);
        self::assertStringEndsWith('/subtitles/de', $this->calls[0]['url']);
    }

    public function testClientManagesTheSubtitleLanguages(): void
    {
        $client = $this->client(fn (string $method) => new MockResponse(json_encode(['data' => 'GET' === $method ? [['code' => 'de', 'label' => 'Deutsch', 'video_count' => 2]] : ['code' => 'de-x-simple', 'label' => 'Einfach']], JSON_THROW_ON_ERROR)));

        self::assertSame('de', $client->listSubtitleLanguages()[0]['code']);
        self::assertSame('de-x-simple', $client->createSubtitleLanguage('de-x-simple', 'Einfach')['code']);
        $client->deleteSubtitleLanguage('de-x-simple');

        self::assertSame(['code' => 'de-x-simple', 'label' => 'Einfach'], json_decode((string) $this->calls[1]['options']['body'], true));
        self::assertSame('DELETE', $this->calls[2]['method']);
        self::assertStringEndsWith('/subtitle-languages/de-x-simple', $this->calls[2]['url']);
    }

    public function testClientRejectsAnInvalidLanguageCodeWithoutCallingTheApi(): void
    {
        $client = $this->client(fn () => new MockResponse('{}'));

        foreach (['', '../x', 'de/en', str_repeat('a', 36), 'd e'] as $code) {
            try {
                $client->deleteSubtitleLanguage($code);
                self::fail('Expected an exception for ' . $code);
            } catch (VideoOptimizerException $e) {
                self::assertSame(400, $e->getStatusCode());
            }
        }
        self::assertSame([], $this->calls);
    }

    public function testControllerListsSubtitlesAndLanguages(): void
    {
        $controller = $this->controller(fn () => new MockResponse(json_encode(['data' => [['language' => 'de']]], JSON_THROW_ON_ERROR)));

        self::assertSame(['_embedded' => ['subtitles' => [['language' => 'de']]]], json_decode((string) $controller->list(self::UUID)->getContent(), true));
        self::assertSame(['_embedded' => ['languages' => [['language' => 'de']]]], json_decode((string) $controller->languages()->getContent(), true));
    }

    public function testControllerForwardsAnUploadedFileAndDropsTheCachedEmbed(): void
    {
        $resolver = $this->prophesize(VideoOptimizerEmbedResolver::class);
        $resolver->forget(self::UUID)->shouldBeCalledTimes(1);
        $controller = $this->controller(fn () => new MockResponse(json_encode(['data' => ['subtitle' => ['language' => 'de'], 'skipped_cues' => 0]], JSON_THROW_ON_ERROR)), $resolver->reveal());

        $response = $controller->upload(new Request(content: json_encode([
            'language' => 'de', 'filename' => 'a.srt', 'kind' => 'captions', 'isDefault' => true,
            'contentBase64' => base64_encode("1\n00:00:01,000 --> 00:00:02,000\nHallo\n"),
        ], JSON_THROW_ON_ERROR)), self::UUID);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame(0, json_decode((string) $response->getContent(), true)['skipped_cues']);
        self::assertStringContainsString("name=\"kind\"\r\n\r\ncaptions", (string) $this->calls[0]['options']['body']);
        self::assertStringContainsString('Hallo', (string) $this->calls[0]['options']['body']);
        $resolver->checkProphecyMethodsPredictions();
    }

    public function testControllerSendsKindAndDefaultOnlyWhenGiven(): void
    {
        $controller = $this->controller(fn () => new MockResponse('{"data":{}}'));

        $controller->upload(new Request(content: json_encode(['language' => 'de', 'filename' => 'a.srt', 'contentBase64' => base64_encode('x')], JSON_THROW_ON_ERROR)), self::UUID);
        $controller->upload(new Request(content: json_encode(['language' => 'de', 'filename' => 'a.srt', 'contentBase64' => base64_encode('x'), 'isDefault' => 'yes'], JSON_THROW_ON_ERROR)), self::UUID);

        foreach ($this->calls as $call) {
            self::assertStringNotContainsString('name="is_default"', (string) $call['options']['body'], 'A missing value must not reset the default flag.');
            self::assertStringNotContainsString('name="kind"', (string) $call['options']['body']);
        }
    }

    public function testControllerRejectsBadUploadsWithoutCallingTheApi(): void
    {
        $controller = $this->controller(fn () => new MockResponse('{}'));

        $cases = [
            'no language' => [['filename' => 'a.srt', 'contentBase64' => base64_encode('x')], 400],
            'no content' => [['language' => 'de', 'filename' => 'a.srt'], 400],
            'invalid base64' => [['language' => 'de', 'filename' => 'a.srt', 'contentBase64' => '***'], 400],
            'over 2 MB' => [['language' => 'de', 'filename' => 'a.srt', 'contentBase64' => base64_encode(str_repeat('a', 2 * 1024 * 1024 + 1))], 413],
        ];
        foreach ($cases as $name => [$payload, $status]) {
            self::assertSame($status, $controller->upload(new Request(content: json_encode($payload, JSON_THROW_ON_ERROR)), self::UUID)->getStatusCode(), $name);
        }
        self::assertSame([], $this->calls);
    }

    public function testControllerServesTheDownloadAsAnAttachment(): void
    {
        $controller = $this->controller(fn () => new MockResponse("WEBVTT\n"));

        $response = $controller->download(self::UUID, 'de');

        self::assertSame("WEBVTT\n", $response->getContent());
        self::assertStringStartsWith('text/vtt', (string) $response->headers->get('Content-Type'));
        self::assertSame('attachment; filename=' . self::UUID . '.de.vtt', $response->headers->get('Content-Disposition'));
        self::assertSame('nosniff', $response->headers->get('X-Content-Type-Options'));
    }

    public function testControllerDeleteDropsTheCachedEmbed(): void
    {
        $resolver = $this->prophesize(VideoOptimizerEmbedResolver::class);
        $resolver->forget(self::UUID)->shouldBeCalledTimes(1);
        $controller = $this->controller(fn () => new MockResponse('{"data":{"success":true}}'), $resolver->reveal());

        self::assertSame(204, $controller->delete(self::UUID, 'de')->getStatusCode());
        $resolver->checkProphecyMethodsPredictions();
    }

    public function testLanguageInUseIsReportedWithItsCode(): void
    {
        $controller = $this->controller(fn () => new MockResponse(
            json_encode(['message' => 'Language is still in use.', 'data' => ['code' => 'subtitle_language_in_use']], JSON_THROW_ON_ERROR),
            ['http_code' => 409],
        ));

        $response = $controller->deleteLanguage('de');

        self::assertSame(409, $response->getStatusCode());
        self::assertSame('subtitle_language_in_use', json_decode((string) $response->getContent(), true)['code']);
    }

    public function testControllerAddsALanguage(): void
    {
        $controller = $this->controller(fn () => new MockResponse(json_encode(['data' => ['code' => 'fr', 'label' => 'Français']], JSON_THROW_ON_ERROR), ['http_code' => 201]));

        $response = $controller->createLanguage(new Request(content: '{"code":"fr","label":"Français"}'));
        $missing = $controller->createLanguage(new Request(content: '{"label":"x"}'));

        self::assertSame(201, $response->getStatusCode());
        self::assertSame(400, $missing->getStatusCode());
        self::assertCount(1, $this->calls);
    }

    private function controller(callable $callback, ?VideoOptimizerEmbedResolver $resolver = null): SubtitleController
    {
        return new SubtitleController($this->client($callback), $resolver);
    }

    private function client(callable $callback): VideoOptimizerClient
    {
        $settings = $this->prophesize(SettingsManager::class);
        $settings->getApiToken()->willReturn('vp_test-token');

        return new VideoOptimizerClient(new MockHttpClient(function (string $method, string $url, array $options) use ($callback): MockResponse {
            $this->calls[] = ['method' => $method, 'url' => $url, 'options' => $options];

            return $callback($method, $url, $options);
        }), $settings->reveal(), 'https://api.videooptimizer.eu/api/v1');
    }
}
