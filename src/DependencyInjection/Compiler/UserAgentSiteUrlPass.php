<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\DependencyInjection\Compiler;

use Scale\VideoOptimizerBundle\Api\UserAgentProvider;
use Symfony\Component\DependencyInjection\Compiler\CompilerPassInterface;
use Symfony\Component\DependencyInjection\ContainerBuilder;

/**
 * Hands the installation's configured public URL to the User-Agent builder. FrameworkBundle stores
 * `framework.router.default_uri` in the `router.request_context.base_url` parameter; when it is
 * missing (router disabled) the builder falls back to the current request's host.
 */
final class UserAgentSiteUrlPass implements CompilerPassInterface
{
    public const PARAMETER = 'router.request_context.base_url';

    public function process(ContainerBuilder $container): void
    {
        if (!$container->hasDefinition(UserAgentProvider::class) || !$container->hasParameter(self::PARAMETER)) {
            return;
        }

        $container->getDefinition(UserAgentProvider::class)->setArgument('$configuredSiteUrl', '%' . self::PARAMETER . '%');
    }
}
