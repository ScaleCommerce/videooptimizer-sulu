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
        $loader = new XmlFileLoader($container, new FileLocator(__DIR__ . '/../Resources/config'));
        $loader->load('services.xml');
    }

    /**
     * Registers the bundle's page-template directory with Sulu so the "VideoOptimizer showcase"
     * template appears in the admin template dropdown without the project copying any files.
     */
    public function prepend(ContainerBuilder $container): void
    {
        if (!$container->hasExtension('sulu_admin')) {
            return;
        }

        $container->prependExtensionConfig('sulu_admin', [
            'templates' => [
                'page' => [
                    'directories' => [
                        'videooptimizer' => \dirname(__DIR__) . '/Resources/config/templates/pages',
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
