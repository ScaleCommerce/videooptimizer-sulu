<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Tests\Unit;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Scale\VideoOptimizerBundle\Api\BaseUrlGuard;
use Scale\VideoOptimizerBundle\Api\VideoOptimizerClient;
use Scale\VideoOptimizerBundle\Api\VideoOptimizerException;
use Scale\VideoOptimizerBundle\DependencyInjection\Configuration;
use Scale\VideoOptimizerBundle\Service\SettingsManager;
use Scale\VideoOptimizerBundle\Service\VideoOptimizerEmbedResolver;
use Scale\VideoOptimizerBundle\Twig\VideoOptimizerExtension;
use Symfony\Component\Config\Definition\Processor;
use Symfony\Component\HttpClient\MockHttpClient;
use Symfony\Component\HttpClient\Response\MockResponse;

class BaseUrlGuardTest extends TestCase
{
    /**
     * @return iterable<string, array{string}>
     */
    public static function rejected(): iterable
    {
        yield 'http' => ['http://api.videooptimizer.eu/api/v1'];
        yield 'no scheme' => ['api.videooptimizer.eu'];
        yield 'userinfo' => ['https://user:pw@api.videooptimizer.eu'];
        yield 'query' => ['https://api.videooptimizer.eu/?a=b'];
        yield 'fragment' => ['https://api.videooptimizer.eu/#x'];
        yield 'localhost' => ['https://localhost/api'];
        yield 'localhost dot' => ['https://localhost./api'];
        yield 'subdomain of localhost' => ['https://foo.localhost/api'];
        yield 'loopback' => ['https://127.0.0.1/api'];
        yield 'private' => ['https://10.0.0.5/api'];
        yield 'link local' => ['https://169.254.169.254/'];
        yield 'ipv6 loopback' => ['https://[::1]/'];
        yield 'decimal ip' => ['https://2130706433/'];
        yield 'hex ip' => ['https://0x7f000001/'];
        yield 'short ip' => ['https://127.1/'];
    }

    #[DataProvider('rejected')]
    public function testRejectsUnsafeUrls(string $url): void
    {
        $this->expectException(\InvalidArgumentException::class);
        BaseUrlGuard::assertHttps($url);
    }

    public function testAcceptsPublicHttpsUrls(): void
    {
        BaseUrlGuard::assertHttps('HTTPS://api.videooptimizer.eu/api/v1');
        BaseUrlGuard::assertHttps('https://player.videooptimizer.eu');
        BaseUrlGuard::assertHttps('https://8.8.8.8/x');
        $this->addToAssertionCount(1);
    }

    public function testRejectsIdnaHostThatNormalisesToLocalhost(): void
    {
        if (!\function_exists('idn_to_ascii')) {
            self::markTestSkipped('ext-intl is not available.');
        }

        $this->expectException(\InvalidArgumentException::class);
        // Fullwidth "localhost" normalises to "localhost".
        BaseUrlGuard::assertHttps("https://\u{FF4C}\u{FF4F}\u{FF43}\u{FF41}\u{FF4C}\u{FF48}\u{FF4F}\u{FF53}\u{FF54}/");
    }

    public function testConfigurationKeepsPlainScalars(): void
    {
        $config = (new Processor())->processConfiguration(new Configuration(), [['api_base_url' => 'http://legacy.example/api', 'embed_base_url' => 'http://legacy.example']]);

        self::assertSame('http://legacy.example/api', $config['api_base_url']);
        self::assertSame('http://legacy.example', $config['embed_base_url']);
    }

    public function testEmbedUrlIsNullForAnUnsafeEmbedBaseUrl(): void
    {
        $resolver = $this->createStub(VideoOptimizerEmbedResolver::class);
        $settings = $this->createStub(SettingsManager::class);

        $unsafe = new VideoOptimizerExtension('http://127.0.0.1', $resolver, $settings);
        $safe = new VideoOptimizerExtension('https://player.videooptimizer.eu', $resolver, $settings);

        self::assertNull($unsafe->embedUrl(['uuid' => 'abc']));
        self::assertSame('https://player.videooptimizer.eu/embed/abc', $safe->embedUrl(['uuid' => 'abc']));
    }

    public function testClientRefusesUnsafeBaseUrlWithoutSendingTheToken(): void
    {
        $sent = false;
        $http = new MockHttpClient(function () use (&$sent): MockResponse {
            $sent = true;

            return new MockResponse('{}');
        });
        $settings = $this->createStub(SettingsManager::class);
        $settings->method('getApiToken')->willReturn('vp_token');

        $client = new VideoOptimizerClient($http, $settings, 'http://169.254.169.254/api');

        try {
            $client->getVideo('abc');
            self::fail('Expected an exception.');
        } catch (VideoOptimizerException) {
            self::assertFalse($sent);
        }
    }

    public function testClientDoesNotFollowRedirects(): void
    {
        $options = null;
        $http = new MockHttpClient(function (string $method, string $url, array $o) use (&$options): MockResponse {
            $options = $o;

            return new MockResponse('{"data":{}}');
        });
        $settings = $this->createStub(SettingsManager::class);
        $settings->method('getApiToken')->willReturn('vp_token');

        (new VideoOptimizerClient($http, $settings, 'https://api.videooptimizer.eu/api/v1'))->getVideo('abc');

        self::assertSame(0, $options['max_redirects'] ?? null);
    }
}
