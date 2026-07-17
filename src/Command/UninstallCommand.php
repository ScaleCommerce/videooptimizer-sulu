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

/**
 * Reverses {@see InstallCommand}: drops the settings table and removes the project's route import
 * and admin-JS wiring. Dropping the table is destructive (it holds the encrypted token), so it
 * requires an interactive confirmation or --force. Run `composer remove` and revert the
 * config/bundles.php entry separately.
 */
#[AsCommand(
    name: 'scale:videooptimizer:uninstall',
    description: 'Remove the VideoOptimizer wiring from the project and drop the settings table.',
)]
class UninstallCommand extends Command
{
    private const JS_DEPENDENCY = 'videooptimizer-sulu';
    private const TABLE = 'vo_settings';

    public function __construct(
        private EntityManagerInterface $entityManager,
        private string $projectDir,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('force', 'f', InputOption::VALUE_NONE, 'Drop the settings table without confirmation.');
        $this->addOption('dry-run', null, InputOption::VALUE_NONE, 'Show what would change without touching anything.');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $dryRun = (bool) $input->getOption('dry-run');

        $io->title('VideoOptimizer uninstall');
        if ($dryRun) {
            $io->note('Dry run — nothing is changed.');
        }

        foreach (['dropTable', 'removeRoutes', 'unwireAdminDependency', 'unwireAdminImport'] as $step) {
            [$status, $message] = $this->{$step}($io, $dryRun, (bool) $input->getOption('force'));
            if ('done' === $status) {
                $io->writeln(' <info>✓</info> ' . $message);
            } elseif ('skip' === $status) {
                $io->writeln(' <comment>•</comment> ' . $message . ' <comment>(nothing to do)</comment>');
            } else {
                $io->warning($message);
            }
        }

        $io->section('Remaining steps');
        $io->listing([
            'Remove the bundle from <comment>config/bundles.php</comment>.',
            'Run <comment>composer remove scalecommerce/videooptimizer-sulu</comment>, then rebuild the admin.',
        ]);
        $io->success('VideoOptimizer wiring removed.');

        return Command::SUCCESS;
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function dropTable(SymfonyStyle $io, bool $dryRun, bool $force): array
    {
        $schemaManager = $this->entityManager->getConnection()->createSchemaManager();
        if (!$schemaManager->tablesExist([self::TABLE])) {
            return ['skip', 'Settings table (' . self::TABLE . ') already gone'];
        }

        if ($dryRun) {
            return ['done', 'Would drop the settings table (' . self::TABLE . ') — holds the encrypted token'];
        }

        if (!$force && !$io->confirm('Drop the "' . self::TABLE . '" table? This deletes the stored API token and settings.', false)) {
            return ['warn', 'Kept the settings table (' . self::TABLE . ') — confirmation declined.'];
        }

        $metadata = $this->entityManager->getClassMetadata(VideoOptimizerSettings::class);
        (new SchemaTool($this->entityManager))->dropSchema([$metadata]);

        return ['done', 'Dropped the settings table (' . self::TABLE . ')'];
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function removeRoutes(SymfonyStyle $io, bool $dryRun, bool $force): array
    {
        $file = $this->projectDir . '/config/routes/scale_videooptimizer_admin.yaml';
        if (!is_file($file)) {
            return ['skip', 'Admin route import already removed'];
        }

        if (!$dryRun) {
            unlink($file);
        }

        return ['done', 'Removed config/routes/scale_videooptimizer_admin.yaml'];
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function unwireAdminDependency(SymfonyStyle $io, bool $dryRun, bool $force): array
    {
        $file = $this->projectDir . '/assets/admin/package.json';
        if (!is_file($file)) {
            return ['skip', 'assets/admin/package.json not present'];
        }

        /** @var array<string, mixed>|null $data */
        $data = json_decode((string) file_get_contents($file), true);
        if (!\is_array($data) || !\is_array($data['dependencies'] ?? null) || !isset($data['dependencies'][self::JS_DEPENDENCY])) {
            return ['skip', 'Admin JS dependency already removed'];
        }

        unset($data['dependencies'][self::JS_DEPENDENCY]);

        if (!$dryRun) {
            $json = json_encode($data, \JSON_PRETTY_PRINT | \JSON_UNESCAPED_SLASHES | \JSON_UNESCAPED_UNICODE);
            file_put_contents($file, $json . "\n");
        }

        return ['done', 'Removed the admin JS dependency from assets/admin/package.json'];
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function unwireAdminImport(SymfonyStyle $io, bool $dryRun, bool $force): array
    {
        $file = $this->projectDir . '/assets/admin/app.js';
        if (!is_file($file)) {
            return ['skip', 'assets/admin/app.js not present'];
        }

        $contents = (string) file_get_contents($file);
        if (!str_contains($contents, self::JS_DEPENDENCY)) {
            return ['skip', 'Admin JS import already removed'];
        }

        if (!$dryRun) {
            $cleaned = preg_replace("/^\\s*import '" . preg_quote(self::JS_DEPENDENCY, '/') . "';\\s*$/m", '', $contents);
            file_put_contents($file, rtrim((string) $cleaned) . "\n");
        }

        return ['done', 'Removed the admin JS import from assets/admin/app.js'];
    }
}
