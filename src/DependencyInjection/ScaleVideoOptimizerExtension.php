<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\DependencyInjection;

use Symfony\Component\Config\FileLocator;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Extension\PrependExtensionInterface;
use Symfony\Component\DependencyInjection\Loader\XmlFileLoader;
use Symfony\Component\HttpKernel\DependencyInjection\Extension;

class ScaleVideoOptimizerExtension extends Extension implements PrependExtensionInterface
{
    public function load(array $configs, ContainerBuilder $container): void
    {
        $config = $this->processConfiguration(new Configuration(), $configs);
        $apiBaseUrl = \is_string($config['api_base_url'] ?? null) ? $config['api_base_url'] : Configuration::DEFAULT_API_BASE_URL;
        $embedBaseUrl = \is_string($config['embed_base_url'] ?? null) ? $config['embed_base_url'] : Configuration::DEFAULT_EMBED_BASE_URL;
        $container->setParameter('scale_video_optimizer.api_base_url', $apiBaseUrl);
        $container->setParameter('scale_video_optimizer.embed_base_url', $embedBaseUrl);

        $loader = new XmlFileLoader($container, new FileLocator(__DIR__ . '/../Resources/config'));
        $loader->load('services.xml');
    }

    /**
     * Registers the bundle's template directories with Sulu so consumers get everything without
     * copying files: the "VideoOptimizer showcase" page template appears in the admin dropdown, and
     * the four content blocks become globally referenceable from any template via
     * `<type ref="vo_media_split"/>` (and the other vo_* keys).
     */
    public function prepend(ContainerBuilder $container): void
    {
        if (!$container->hasExtension('sulu_admin')) {
            return;
        }

        $templatesDir = \dirname(__DIR__) . '/Resources/config/templates';

        $container->prependExtensionConfig('sulu_admin', [
            'templates' => [
                'page' => [
                    'directories' => [
                        'videooptimizer' => $templatesDir . '/pages',
                    ],
                ],
                'block' => [
                    'directories' => [
                        'videooptimizer' => $templatesDir . '/blocks',
                    ],
                ],
            ],
        ]);
    }

    public function getAlias(): string
    {
        return 'scale_video_optimizer';
    }
}
