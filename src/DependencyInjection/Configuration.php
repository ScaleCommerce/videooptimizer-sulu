<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\DependencyInjection;

use Symfony\Component\Config\Definition\Builder\TreeBuilder;
use Symfony\Component\Config\Definition\ConfigurationInterface;

class Configuration implements ConfigurationInterface
{
    public const DEFAULT_API_BASE_URL = 'https://api.videooptimizer.eu/api/v1';
    public const DEFAULT_EMBED_BASE_URL = 'https://player.videooptimizer.eu';

    public function getConfigTreeBuilder(): TreeBuilder
    {
        $treeBuilder = new TreeBuilder('scale_video_optimizer');

        $treeBuilder->getRootNode()
            ->children()
                ->scalarNode('api_base_url')
                    ->info('Base URL of the VideoOptimizer REST API (override for staging/self-hosted).')
                    ->defaultValue(self::DEFAULT_API_BASE_URL)
                    ->cannotBeEmpty()
                ->end()
                ->scalarNode('embed_base_url')
                    ->info('Base URL the public embed player is served from.')
                    ->defaultValue(self::DEFAULT_EMBED_BASE_URL)
                    ->cannotBeEmpty()
                ->end()
                ->scalarNode('cache_pool')
                    ->info('Service id of a PSR-6/Symfony cache pool for the embed data. Must be shared between the admin and the website (default: a filesystem pool in the shared var directory). Point it at e.g. a Redis pool for multi-server setups.')
                    ->defaultNull()
                ->end()
                ->booleanNode('auto_inject_assets')
                    ->info('Automatically inject the frontend CSS/JS into pages that render a VideoOptimizer surface. Disable to wire the assets manually via the @ScaleVideoOptimizer/partials/assets.html.twig partial.')
                    ->defaultTrue()
                ->end()
            ->end();

        return $treeBuilder;
    }
}
