<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Admin;

use Sulu\Bundle\AdminBundle\Admin\Admin;
use Sulu\Bundle\AdminBundle\Admin\Navigation\NavigationItem;
use Sulu\Bundle\AdminBundle\Admin\Navigation\NavigationItemCollection;
use Sulu\Bundle\AdminBundle\Admin\View\ViewBuilderFactoryInterface;
use Sulu\Bundle\AdminBundle\Admin\View\ViewCollection;
use Scale\VideoOptimizerBundle\Security\VideoOptimizerPermissions;
use Sulu\Component\Security\Authorization\PermissionTypes;
use Sulu\Component\Security\Authorization\SecurityCheckerInterface;

class VideoOptimizerAdmin extends Admin
{
    public const SETTINGS_VIEW = 'scale_videooptimizer.settings';
    public const LIBRARIES_VIEW = 'scale_videooptimizer.libraries';
    public const VIDEOS_VIEW = 'scale_videooptimizer.videos';

    public function __construct(
        private ViewBuilderFactoryInterface $viewBuilderFactory,
        private ?SecurityCheckerInterface $securityChecker = null,
    ) {
    }

    public function configureNavigationItems(NavigationItemCollection $navigationItemCollection): void
    {
        $root = new NavigationItem('scale_videooptimizer.title');
        $root->setPosition(40);
        $root->setIcon('su-video');

        // Each entry shows only for users who may view that area; the root opens the first one.
        $entries = [
            [self::VIDEOS_VIEW, 'scale_videooptimizer.videos_nav', 10, VideoOptimizerPermissions::VIDEOS],
            [self::LIBRARIES_VIEW, 'scale_videooptimizer.libraries_nav', 20, VideoOptimizerPermissions::LIBRARIES],
            [self::SETTINGS_VIEW, 'scale_videooptimizer.settings_nav', 30, VideoOptimizerPermissions::SETTINGS],
        ];
        foreach ($entries as [$view, $title, $position, $context]) {
            if (!$this->can($context, PermissionTypes::VIEW)) {
                continue;
            }
            $item = new NavigationItem($title);
            $item->setPosition($position);
            $item->setView($view);
            $root->addChild($item);
            if (null === $root->getView()) {
                $root->setView($view);
            }
        }

        if ([] === $root->getChildren()) {
            return;
        }

        // Top-level navigation entry (own section with its own icon) — video management is a
        // primary editorial task, so it lives in the main left nav, not nested under Settings.
        $navigationItemCollection->add($root);
    }

    public function configureViews(ViewCollection $viewCollection): void
    {
        // Custom React views (registered in JS via viewRegistry) — see Resources/js. A view is only
        // registered for users who may view its area.
        $views = [
            [self::SETTINGS_VIEW, '/videooptimizer/settings', 'scale_videooptimizer_settings', VideoOptimizerPermissions::SETTINGS],
            [self::LIBRARIES_VIEW, '/videooptimizer/libraries', 'scale_videooptimizer_libraries', VideoOptimizerPermissions::LIBRARIES],
            [self::VIDEOS_VIEW, '/videooptimizer/videos', 'scale_videooptimizer_videos', VideoOptimizerPermissions::VIDEOS],
        ];
        foreach ($views as [$name, $path, $component, $context]) {
            if ($this->can($context, PermissionTypes::VIEW)) {
                $viewCollection->add($this->viewBuilderFactory->createViewBuilder($name, $path, $component));
            }
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function getSecurityContexts(): array
    {
        return [
            self::SULU_ADMIN_SECURITY_SYSTEM => [
                'VideoOptimizer' => VideoOptimizerPermissions::contexts(),
            ],
        ];
    }

    public function getConfigKey(): ?string
    {
        return 'scale_videooptimizer';
    }

    /**
     * What the current user may do, so the admin UI hides actions the API would refuse.
     *
     * @return array<string, mixed>
     */
    public function getConfig(): array
    {
        $permissions = [];
        foreach (VideoOptimizerPermissions::CONTEXTS as $name => $context) {
            foreach (VideoOptimizerPermissions::contexts()[$context] as $type) {
                $permissions[$name][$type] = $this->can($context, $type);
            }
        }

        return ['permissions' => $permissions];
    }

    private function can(string $context, string $permission): bool
    {
        // Without Sulu's security checker nothing restricts the admin, as before 2.1.
        return null === $this->securityChecker || $this->securityChecker->hasPermission($context, $permission);
    }
}
