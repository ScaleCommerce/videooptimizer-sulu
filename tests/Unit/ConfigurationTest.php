<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Scale\VideoOptimizerBundle\DependencyInjection\Configuration;
use Symfony\Component\Config\Definition\Processor;

class ConfigurationTest extends TestCase
{
    public function testEmbedBaseUrlDefaultsToThePlayerHost(): void
    {
        $config = (new Processor())->processConfiguration(new Configuration(), []);

        self::assertSame('https://player.videooptimizer.eu', $config['embed_base_url']);
    }

    public function testConfiguredEmbedBaseUrlIsKept(): void
    {
        $config = (new Processor())->processConfiguration(new Configuration(), [['embed_base_url' => 'https://videooptimizer.eu']]);

        self::assertSame('https://videooptimizer.eu', $config['embed_base_url']);
    }
}
