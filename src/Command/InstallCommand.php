<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Command;

use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Scale\VideoOptimizerBundle\Entity\VideoOptimizerSettings;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\Filesystem\Filesystem;

/**
 * One-shot, idempotent installer: imports the admin API routes, wires the admin JS into the
 * project's build, and creates the settings table — the manual steps a plain `composer require`
 * cannot do. Safe to re-run; it only fills in what is missing.
 */
#[AsCommand(
    name: 'scale:videooptimizer:install',
    description: 'Wire the VideoOptimizer bundle into the project (routes, admin JS, settings table).',
)]
class InstallCommand extends Command
{
    private const JS_DEPENDENCY = 'videooptimizer-sulu';
    private const JS_DEPENDENCY_PATH = 'file:../../vendor/scalecommerce/videooptimizer-sulu/src/Resources/js';
    private const JS_IMPORT = "import 'videooptimizer-sulu';";
    private const TABLE = 'vo_settings';

    public function __construct(
        private EntityManagerInterface $entityManager,
        private string $projectDir,
        private string $cacheDir,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('dry-run', null, InputOption::VALUE_NONE, 'Show what would change without writing anything.');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $dryRun = (bool) $input->getOption('dry-run');

        $io->title('VideoOptimizer install');
        if ($dryRun) {
            $io->note('Dry run — no files or tables are changed.');
        }

        $changed = false;
        foreach (['importRoutes', 'wireAdminDependency', 'wireAdminImport', 'createSettingsTable'] as $step) {
            [$status, $message] = $this->{$step}($dryRun);
            if ('done' === $status) {
                $io->writeln(' <info>✓</info> ' . $message);
                $changed = true;
            } elseif ('skip' === $status) {
                $io->writeln(' <comment>•</comment> ' . $message . ' <comment>(already done)</comment>');
            } else {
                $io->warning($message);
            }
        }

        // The new route file only becomes visible once the (already-warmed) cache is dropped.
        if ($changed && !$dryRun) {
            if ($this->clearCache()) {
                $io->writeln(' <info>✓</info> Cleared the cache so the new routes are served');
            } else {
                $io->warning('Could not clear the cache — run "bin/adminconsole cache:clear" so the routes are picked up.');
            }
        }

        $io->section('Remaining steps');
        $io->listing([
            'Build the admin frontend: <comment>cd assets/admin && npm install && npm run build</comment>',
            'Open <comment>Settings → VideoOptimizer</comment> in the admin and paste your API token.',
        ]);
        $io->success('VideoOptimizer is wired in.');

        return Command::SUCCESS;
    }

    /**
     * Drops the (already-warmed) cache dir so the freshly written route file is served on the next
     * request. Best-effort — returns false if the directory cannot be cleared.
     */
    private function clearCache(): bool
    {
        try {
            $filesystem = new Filesystem();
            if (is_dir($this->cacheDir)) {
                $filesystem->remove($this->cacheDir);
                $filesystem->mkdir($this->cacheDir);
            }

            return true;
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function importRoutes(bool $dryRun): array
    {
        $file = $this->projectDir . '/config/routes/scale_videooptimizer_admin.yaml';
        if (is_file($file)) {
            return ['skip', 'Admin API routes imported'];
        }

        $contents = <<<YAML
            scale_videooptimizer_api:
                resource: "@ScaleVideoOptimizerBundle/Resources/config/routing_admin.yaml"
                prefix: /admin/api

            YAML;

        if (!$dryRun) {
            $dir = \dirname($file);
            if (!is_dir($dir) && !mkdir($dir, 0o775, true) && !is_dir($dir)) {
                return ['warn', 'Could not create ' . $dir];
            }
            file_put_contents($file, $contents);
        }

        return ['done', 'Imported the admin API routes (config/routes/scale_videooptimizer_admin.yaml)'];
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function wireAdminDependency(bool $dryRun): array
    {
        $file = $this->projectDir . '/assets/admin/package.json';
        if (!is_file($file)) {
            return ['warn', 'assets/admin/package.json not found — add the admin JS dependency manually.'];
        }

        $raw = (string) file_get_contents($file);
        /** @var array<string, mixed>|null $data */
        $data = json_decode($raw, true);
        if (!\is_array($data)) {
            return ['warn', 'assets/admin/package.json is not valid JSON — add the admin JS dependency manually.'];
        }

        $dependencies = \is_array($data['dependencies'] ?? null) ? $data['dependencies'] : [];
        if (isset($dependencies[self::JS_DEPENDENCY])) {
            return ['skip', 'Admin JS dependency in assets/admin/package.json'];
        }

        $dependencies[self::JS_DEPENDENCY] = self::JS_DEPENDENCY_PATH;
        ksort($dependencies);
        $data['dependencies'] = $dependencies;

        if (!$dryRun) {
            $json = json_encode($data, \JSON_PRETTY_PRINT | \JSON_UNESCAPED_SLASHES | \JSON_UNESCAPED_UNICODE);
            file_put_contents($file, $json . "\n");
        }

        return ['done', 'Added the admin JS dependency to assets/admin/package.json'];
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function wireAdminImport(bool $dryRun): array
    {
        $file = $this->projectDir . '/assets/admin/app.js';
        if (!is_file($file)) {
            return ['warn', "assets/admin/app.js not found — add \"" . self::JS_IMPORT . '" manually.'];
        }

        $contents = (string) file_get_contents($file);
        if (str_contains($contents, self::JS_DEPENDENCY)) {
            return ['skip', 'Admin JS import in assets/admin/app.js'];
        }

        if (!$dryRun) {
            $contents = rtrim($contents, "\n") . "\n" . self::JS_IMPORT . "\n";
            file_put_contents($file, $contents);
        }

        return ['done', 'Added the admin JS import to assets/admin/app.js'];
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function createSettingsTable(bool $dryRun): array
    {
        $schemaManager = $this->entityManager->getConnection()->createSchemaManager();
        if ($schemaManager->tablesExist([self::TABLE])) {
            return ['skip', 'Settings table (' . self::TABLE . ')'];
        }

        if (!$dryRun) {
            $metadata = $this->entityManager->getClassMetadata(VideoOptimizerSettings::class);
            (new SchemaTool($this->entityManager))->createSchema([$metadata]);
        }

        return ['done', 'Created the settings table (' . self::TABLE . ')'];
    }
}
