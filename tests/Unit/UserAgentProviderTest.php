<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Scale\VideoOptimizerBundle\Api\UserAgentProvider;
use Scale\VideoOptimizerBundle\DependencyInjection\Compiler\UserAgentSiteUrlPass;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Definition;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;

class UserAgentProviderTest extends TestCase
{
    /**
     * Same pattern the VideoOptimizer app uses to parse the header.
     */
    private const APP_PATTERN = '~^VideoOptimizer-Sulu/(?<plugin>[^\s(]+)(?: \((?<comment>[^()]*)\))?$~';

    public function testFormatMatchesTheDocumentedExample(): void
    {
        self::assertSame(
            'VideoOptimizer-Sulu/1.7.3 (Sulu 2.6.8; PHP 8.3.14; +https://www.example.com)',
            UserAgentProvider::format('1.7.3', '2.6.8', '8.3.14', 'https://www.example.com'),
        );
    }

    public function testFormatOmitsEmptyParts(): void
    {
        self::assertSame('VideoOptimizer-Sulu/1.7.3 (PHP 8.3.14)', UserAgentProvider::format('1.7.3', null, '8.3.14', null));
        self::assertSame('VideoOptimizer-Sulu/1.7.3 (Sulu 3.0.7; PHP 8.3.14)', UserAgentProvider::format('1.7.3', '3.0.7', '8.3.14', ''));
        self::assertSame('VideoOptimizer-Sulu/unknown', UserAgentProvider::format('', null, null, null));
    }

    public function testSanitizeStripsDelimitersControlCharsAndCapsLength(): void
    {
        self::assertSame('1.0 evil', UserAgentProvider::sanitize("1.0; (evil)\r\n"));
        self::assertSame('ab', UserAgentProvider::sanitize("a\x00\x1F\x7Fb"));
        self::assertSame('caf', UserAgentProvider::sanitize('café'));
        self::assertSame(100, \strlen(UserAgentProvider::sanitize(str_repeat('x', 250))));
        self::assertSame('', UserAgentProvider::sanitize(null));

        $userAgent = UserAgentProvider::format("1.0;(x)\n", 'dev main', '8.3', 'https://a.example;)(b');
        self::assertSame('VideoOptimizer-Sulu/1.0x (Sulu devmain; PHP 8.3; +https://a.exampleb)', $userAgent);
        self::assertMatchesRegularExpression(self::APP_PATTERN, $userAgent);
    }

    public function testUsesInstalledVersionsStrippingTheVPrefix(): void
    {
        $provider = new UserAgentProvider(null, 'https://www.example.com/some/path', $this->lookup(['scalecommerce/videooptimizer-sulu' => 'v1.7.3', 'sulu/sulu' => 'v3.0.7']), '8.3.14');

        self::assertSame('VideoOptimizer-Sulu/1.7.3 (Sulu 3.0.7; PHP 8.3.14; +https://www.example.com)', $provider->getUserAgent());
    }

    public function testFallsBackToUnknownPluginVersionAndOmitsMissingSulu(): void
    {
        $provider = new UserAgentProvider(null, null, $this->lookup([]), '8.3.14');

        self::assertSame('VideoOptimizer-Sulu/unknown (PHP 8.3.14)', $provider->getUserAgent());
    }

    public function testOmitsSiteUrlWithoutConfigAndRequest(): void
    {
        $provider = new UserAgentProvider(new RequestStack(), null, $this->lookup(['scalecommerce/videooptimizer-sulu' => '1.7.3']), '8.3.14');

        self::assertSame('VideoOptimizer-Sulu/1.7.3 (PHP 8.3.14)', $provider->getUserAgent());
    }

    public function testFallsBackToTheMainRequestHost(): void
    {
        $requestStack = new RequestStack();
        $requestStack->push(Request::create('https://shop.example.com:8443/admin/api/videos'));
        $provider = new UserAgentProvider($requestStack, '', $this->lookup(['scalecommerce/videooptimizer-sulu' => '1.7.3']), '8.3.14');

        self::assertSame('VideoOptimizer-Sulu/1.7.3 (PHP 8.3.14; +https://shop.example.com:8443)', $provider->getUserAgent());
    }

    public function testConfiguredSiteUrlWinsOverTheRequest(): void
    {
        $requestStack = new RequestStack();
        $requestStack->push(Request::create('https://admin.example.com/admin'));
        $provider = new UserAgentProvider($requestStack, 'https://www.example.com', $this->lookup(['scalecommerce/videooptimizer-sulu' => '1.7.3']), '8.3.14');

        self::assertStringEndsWith('; +https://www.example.com)', $provider->getUserAgent());
    }

    public function testIgnoresTheSkeletonLocalhostDefaultAndNonHttpUrls(): void
    {
        $requestStack = new RequestStack();
        $requestStack->push(Request::create('https://www.example.com/'));

        foreach (['http://localhost', 'http://127.0.0.1:8000', 'ftp://www.example.org', 'not a url'] as $configured) {
            $provider = new UserAgentProvider($requestStack, $configured, $this->lookup([]), '8.3.14');
            self::assertStringEndsWith('; +https://www.example.com)', $provider->getUserAgent(), $configured);
        }
    }

    public function testVersionsAreLookedUpOnlyOnce(): void
    {
        $calls = 0;
        $provider = new UserAgentProvider(null, null, function (string $package) use (&$calls): ?string {
            ++$calls;

            return '1.0.0';
        }, '8.3.14');

        $provider->getUserAgent();
        $provider->getUserAgent();

        self::assertSame(2, $calls, 'Plugin and Sulu version must be resolved once, not per request.');
    }

    public function testDefaultLookupReadsComposer(): void
    {
        $userAgent = (new UserAgentProvider())->getUserAgent();

        self::assertMatchesRegularExpression(self::APP_PATTERN, $userAgent);
        self::assertStringContainsString('PHP ' . \PHP_VERSION, $userAgent);
    }

    public function testCompilerPassWiresTheDefaultUriParameter(): void
    {
        $container = new ContainerBuilder();
        $container->setDefinition(UserAgentProvider::class, new Definition(UserAgentProvider::class));
        $container->setParameter(UserAgentSiteUrlPass::PARAMETER, 'https://www.example.com');

        (new UserAgentSiteUrlPass())->process($container);

        self::assertSame('%router.request_context.base_url%', $container->getDefinition(UserAgentProvider::class)->getArgument('$configuredSiteUrl'));
    }

    public function testCompilerPassLeavesTheArgumentAloneWithoutRouter(): void
    {
        $container = new ContainerBuilder();
        $container->setDefinition(UserAgentProvider::class, new Definition(UserAgentProvider::class));

        (new UserAgentSiteUrlPass())->process($container);

        self::assertSame([], $container->getDefinition(UserAgentProvider::class)->getArguments());
    }

    /**
     * @param array<string, string> $versions
     *
     * @return \Closure(string): ?string
     */
    private function lookup(array $versions): \Closure
    {
        return static fn (string $package): ?string => $versions[$package] ?? null;
    }
}
