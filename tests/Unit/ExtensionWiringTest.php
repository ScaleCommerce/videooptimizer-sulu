<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Scale\VideoOptimizerBundle\DependencyInjection\ScaleVideoOptimizerExtension;
use Scale\VideoOptimizerBundle\Service\VideoOptimizerEmbedResolver;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Reference;

class ExtensionWiringTest extends TestCase
{
    public function testEmbedCacheUsesTheSharedDirectoryWhenTheKernelProvidesOne(): void
    {
        $container = $this->load(['kernel.share_dir' => '/srv/var/share']);

        self::assertSame('%kernel.share_dir%', $container->getParameter('scale_video_optimizer.cache_directory'));
        self::assertSame('%scale_video_optimizer.cache_directory%', $container->getDefinition('scale_video_optimizer.cache')->getArgument(2));
    }

    public function testEmbedCacheFallsBackToVarShareBeforeSymfony74(): void
    {
        $container = $this->load([]);

        self::assertSame('%kernel.project_dir%/var/share/%kernel.environment%', $container->getParameter('scale_video_optimizer.cache_directory'));
    }

    public function testResolverReadsTheDedicatedPoolAndNotTheContextLocalCacheApp(): void
    {
        $container = $this->load([]);

        $argument = $container->getDefinition(VideoOptimizerEmbedResolver::class)->getArgument(1);
        self::assertInstanceOf(Reference::class, $argument);
        self::assertSame('scale_video_optimizer.cache', (string) $argument);
    }

    public function testCachePoolOptionAliasesTheServiceToACustomPool(): void
    {
        $container = $this->load([], ['cache_pool' => 'cache.redis_pool']);

        self::assertTrue($container->hasAlias('scale_video_optimizer.cache'));
        self::assertSame('cache.redis_pool', (string) $container->getAlias('scale_video_optimizer.cache'));
        self::assertFalse($container->hasDefinition('scale_video_optimizer.cache'));
    }

    public function testWebhookReceiverReferencesRealSuluServices(): void
    {
        $container = $this->load([]);
        $arguments = $container->getDefinition(\Scale\VideoOptimizerBundle\Controller\WebhookController::class)->getArguments();

        $ids = array_map(static fn ($argument): string => $argument instanceof Reference ? (string) $argument : '', $arguments);
        self::assertContains('sulu_http_cache.cache_manager', $ids, 'The page cache is only invalidated through the real Sulu service id.');

        // The ids must exist in Sulu itself: an unknown id with on-invalid="null" silently disables the feature.
        $httpCache = \dirname((string) (new \ReflectionClass(\Sulu\Bundle\HttpCacheBundle\Cache\CacheManager::class))->getFileName(), 2) . '/Resources/config';
        self::assertStringContainsString("'sulu_http_cache.cache_manager'", (string) file_get_contents($httpCache . '/cache-manager.php'));
        self::assertStringContainsString("'sulu_http_cache.reference_store'", (string) file_get_contents($httpCache . '/services.php'));
        $resolverIds = array_map(static fn ($argument): string => $argument instanceof Reference ? (string) $argument : '', $container->getDefinition(VideoOptimizerEmbedResolver::class)->getArguments());
        self::assertContains('sulu_http_cache.reference_store', $resolverIds);
    }

    /**
     * @param array<string, string> $parameters
     * @param array<string, mixed>  $config
     */
    private function load(array $parameters, array $config = []): ContainerBuilder
    {
        $container = new ContainerBuilder();
        $container->setParameter('kernel.project_dir', '/srv');
        $container->setParameter('kernel.environment', 'prod');
        foreach ($parameters as $name => $value) {
            $container->setParameter($name, $value);
        }

        (new ScaleVideoOptimizerExtension())->load([$config], $container);

        return $container;
    }
}
