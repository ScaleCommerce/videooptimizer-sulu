<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Command;

use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Scale\VideoOptimizerBundle\Entity\VideoOptimizerSettings;
use Scale\VideoOptimizerBundle\Entity\VideoOptimizerWebhook;
use Scale\VideoOptimizerBundle\Security\VideoOptimizerPermissions;
use Sulu\Bundle\AdminBundle\Admin\Admin;
use Sulu\Bundle\SecurityBundle\Entity\Permission;
use Sulu\Component\Security\Authentication\RoleRepositoryInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * One-shot, idempotent installer: imports the admin API routes, wires the admin JS into the
 * project's build, and creates the settings table — the manual steps a plain `composer require`
 * cannot do. Safe to re-run; it only fills in what is missing.
 */
#[AsCommand(
    name: 'scale:videooptimizer:install',
    description: 'Wire the VideoOptimizer bundle into the project (routes, admin JS, settings and webhook tables, permissions of the admin roles).',
)]
class InstallCommand extends Command
{
    private const JS_DEPENDENCY = 'videooptimizer-sulu';
    private const JS_DEPENDENCY_PATH = 'file:../../vendor/scalecommerce/videooptimizer-sulu/src/Resources/js';
    private const JS_IMPORT = "import 'videooptimizer-sulu';";
    private const TABLE = 'vo_settings';
    private const WEBHOOK_TABLE = 'vo_webhook';

    public function __construct(
        private EntityManagerInterface $entityManager,
        private string $projectDir,
        private ?RoleRepositoryInterface $roleRepository = null,
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

        foreach (['importRoutes', 'importWebsiteRoutes', 'wireAdminDependency', 'wireAdminImport', 'createSettingsTable', 'createWebhookTable', 'grantSecurityContexts'] as $step) {
            [$status, $message] = $this->{$step}($dryRun);
            if ('done' === $status) {
                $io->writeln(' <info>✓</info> ' . $message);
            } elseif ('skip' === $status) {
                $io->writeln(' <comment>•</comment> ' . $message . ' <comment>(already done)</comment>');
            } else {
                $io->warning($message);
            }
        }

        $io->section('Remaining steps');
        $io->listing([
            // A newly written route file stays invisible to an already-warmed cache. Clearing it must be
            // a separate command: doing it from inside this running process would delete the cache this
            // process is still using and crash on shutdown.
            'Clear the cache of both kernels so the new routes are served: <comment>bin/adminconsole cache:clear</comment> and <comment>bin/websiteconsole cache:clear</comment>',
            'Build the admin frontend: <comment>cd assets/admin && npm install && npm run build</comment>',
            'Open <comment>Settings → VideoOptimizer</comment> in the admin and paste your API token.',
        ]);
        $io->success('VideoOptimizer is wired in.');

        return Command::SUCCESS;
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
     * Public website route of the webhook receiver. The `_website` suffix makes Sulu load it in the website kernel only.
     *
     * @return array{0: string, 1: string}
     */
    private function importWebsiteRoutes(bool $dryRun): array
    {
        $file = $this->projectDir . '/config/routes/scale_videooptimizer_website.yaml';
        if (is_file($file)) {
            return ['skip', 'Website routes imported (webhook receiver)'];
        }

        $contents = <<<YAML
            scale_videooptimizer_website:
                resource: "@ScaleVideoOptimizerBundle/Resources/config/routing_website.yaml"

            YAML;

        if (!$dryRun) {
            $dir = \dirname($file);
            if (!is_dir($dir) && !mkdir($dir, 0o775, true) && !is_dir($dir)) {
                return ['warn', 'Could not create ' . $dir];
            }
            file_put_contents($file, $contents);
        }

        return ['done', 'Imported the website routes of the webhook receiver (config/routes/scale_videooptimizer_website.yaml)'];
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

    /**
     * The webhook signing secret lives in a table of its own, so an upgrade only needs this command to be re-run.
     *
     * @return array{0: string, 1: string}
     */
    private function createWebhookTable(bool $dryRun): array
    {
        $schemaManager = $this->entityManager->getConnection()->createSchemaManager();
        if ($schemaManager->tablesExist([self::WEBHOOK_TABLE])) {
            return ['skip', 'Webhook table (' . self::WEBHOOK_TABLE . ')'];
        }

        if (!$dryRun) {
            $metadata = $this->entityManager->getClassMetadata(VideoOptimizerWebhook::class);
            (new SchemaTool($this->entityManager))->createSchema([$metadata]);
        }

        return ['done', 'Created the webhook table (' . self::WEBHOOK_TABLE . ')'];
    }

    /**
     * 2.1 checks Sulu security contexts. Roles of the Sulu admin created before that have none of them
     * and would lose access, so they get all permissions (what they could do before). This is a one-time
     * migration: as soon as any role holds a VideoOptimizer context it is skipped entirely, so roles
     * created later without access, and restrictions made afterwards, survive a re-run.
     *
     * @return array{0: string, 1: string}
     */
    private function grantSecurityContexts(bool $dryRun): array
    {
        $label = 'Permissions of the admin roles';
        if (null === $this->roleRepository) {
            return ['warn', 'Sulu role repository not available — grant the "VideoOptimizer" permissions to your admin roles under Settings > User roles.'];
        }

        $contexts = array_values(VideoOptimizerPermissions::CONTEXTS);
        $roles = $this->roleRepository->findAllRoles();
        foreach ($roles as $role) {
            foreach ($role->getPermissions() as $permission) {
                if (\in_array($permission->getContext(), $contexts, true)) {
                    return ['skip', $label];
                }
            }
        }

        $granted = [];
        foreach ($roles as $role) {
            if (Admin::SULU_ADMIN_SECURITY_SYSTEM !== $role->getSystem() || $role->getAnonymous()) {
                continue;
            }

            if (!$dryRun) {
                foreach ($contexts as $context) {
                    $permission = new Permission();
                    $permission->setRole($role);
                    $permission->setContext($context);
                    $permission->setPermissions(127);
                    $role->addPermission($permission);
                }
                $this->entityManager->persist($role);
            }
            $granted[] = $role->getName();
        }

        if ([] === $granted) {
            return ['skip', $label];
        }
        if (!$dryRun) {
            $this->entityManager->flush();
        }

        return ['done', 'Granted the VideoOptimizer permissions (videos, libraries, settings) to the admin roles: ' . implode(', ', $granted)];
    }
}
