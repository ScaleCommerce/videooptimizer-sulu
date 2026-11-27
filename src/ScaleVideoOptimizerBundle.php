<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle;

use Scale\VideoOptimizerBundle\DependencyInjection\Compiler\UserAgentSiteUrlPass;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\HttpKernel\Bundle\Bundle;

class ScaleVideoOptimizerBundle extends Bundle
{
    public function build(ContainerBuilder $container): void
    {
        parent::build($container);

        $container->addCompilerPass(new UserAgentSiteUrlPass());
    }
}
