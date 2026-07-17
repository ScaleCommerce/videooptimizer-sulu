<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Tests\Unit;

use Doctrine\DBAL\Connection;
use Doctrine\DBAL\Schema\AbstractSchemaManager;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Prophecy\PhpUnit\ProphecyTrait;
use Scale\VideoOptimizerBundle\Command\InstallCommand;
use Symfony\Component\Console\Tester\CommandTester;

class InstallCommandTest extends TestCase
{
    use ProphecyTrait;

    private string $projectDir;

    protected function setUp(): void
    {
        $this->projectDir = sys_get_temp_dir() . '/vo-install-' . uniqid();
        mkdir($this->projectDir . '/config/routes', 0o777, true);
        mkdir($this->projectDir . '/assets/admin', 0o777, true);
        file_put_contents(
            $this->projectDir . '/assets/admin/package.json',
            json_encode(['dependencies' => ['react' => '^17.0.0']], \JSON_PRETTY_PRINT) . "\n",
        );
        file_put_contents($this->projectDir . '/assets/admin/app.js', "// project js\n");
    }

    protected function tearDown(): void
    {
        $this->removeDir($this->projectDir);
    }

    public function testWiresRoutesDependencyAndImportAndSkipsExistingTable(): void
    {
        $tester = new CommandTester(new InstallCommand($this->entityManager(tableExists: true), $this->projectDir));
        $tester->execute([]);
        $tester->assertCommandIsSuccessful();

        $routes = (string) file_get_contents($this->projectDir . '/config/routes/scale_videooptimizer_admin.yaml');
        self::assertStringContainsString('@ScaleVideoOptimizerBundle/Resources/config/routing_admin.yaml', $routes);
        self::assertStringContainsString('prefix: /admin/api', $routes);

        /** @var array<string, mixed> $package */
        $package = json_decode((string) file_get_contents($this->projectDir . '/assets/admin/package.json'), true);
        self::assertArrayHasKey('videooptimizer-sulu', $package['dependencies']);
        self::assertArrayHasKey('react', $package['dependencies'], 'existing dependencies are kept');

        self::assertStringContainsString("import 'videooptimizer-sulu';", (string) file_get_contents($this->projectDir . '/assets/admin/app.js'));
        self::assertStringContainsString('already done', $tester->getDisplay(), 'the existing table is skipped');
    }

    public function testDryRunChangesNothing(): void
    {
        $tester = new CommandTester(new InstallCommand($this->entityManager(tableExists: true), $this->projectDir));
        $tester->execute(['--dry-run' => true]);
        $tester->assertCommandIsSuccessful();

        self::assertFileDoesNotExist($this->projectDir . '/config/routes/scale_videooptimizer_admin.yaml');
        self::assertStringNotContainsString('videooptimizer-sulu', (string) file_get_contents($this->projectDir . '/assets/admin/app.js'));
    }

    public function testIsIdempotent(): void
    {
        (new CommandTester(new InstallCommand($this->entityManager(tableExists: true), $this->projectDir)))->execute([]);

        $second = new CommandTester(new InstallCommand($this->entityManager(tableExists: true), $this->projectDir));
        $second->execute([]);
        $second->assertCommandIsSuccessful();
        self::assertStringContainsString('already done', $second->getDisplay());

        // The dependency and the import each appear exactly once after two runs.
        /** @var array<string, mixed> $package */
        $package = json_decode((string) file_get_contents($this->projectDir . '/assets/admin/package.json'), true);
        self::assertCount(1, array_keys($package['dependencies'], 'file:../../vendor/scalecommerce/videooptimizer-sulu/src/Resources/js', true));
        self::assertSame(1, substr_count((string) file_get_contents($this->projectDir . '/assets/admin/app.js'), "import 'videooptimizer-sulu';"));
    }

    private function entityManager(bool $tableExists): EntityManagerInterface
    {
        $schemaManager = $this->prophesize(AbstractSchemaManager::class);
        $schemaManager->tablesExist(['vo_settings'])->willReturn($tableExists);

        $connection = $this->prophesize(Connection::class);
        $connection->createSchemaManager()->willReturn($schemaManager->reveal());

        $entityManager = $this->prophesize(EntityManagerInterface::class);
        $entityManager->getConnection()->willReturn($connection->reveal());

        return $entityManager->reveal();
    }

    private function removeDir(string $dir): void
    {
        if (!is_dir($dir)) {
            return;
        }
        $items = scandir($dir) ?: [];
        foreach ($items as $item) {
            if ('.' === $item || '..' === $item) {
                continue;
            }
            $path = $dir . '/' . $item;
            is_dir($path) ? $this->removeDir($path) : unlink($path);
        }
        rmdir($dir);
    }
}
