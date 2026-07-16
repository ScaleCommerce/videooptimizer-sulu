<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Admin;

use Sulu\Bundle\AdminBundle\Admin\Admin;
use Sulu\Bundle\AdminBundle\Admin\Navigation\NavigationItem;
use Sulu\Bundle\AdminBundle\Admin\Navigation\NavigationItemCollection;
use Sulu\Bundle\AdminBundle\Admin\View\ViewBuilderFactoryInterface;
use Sulu\Bundle\AdminBundle\Admin\View\ViewCollection;

class VideoOptimizerAdmin extends Admin
{
    public const SETTINGS_VIEW = 'scale_videooptimizer.settings';
    public const LIBRARIES_VIEW = 'scale_videooptimizer.libraries';
    public const VIDEOS_VIEW = 'scale_videooptimizer.videos';

    public function __construct(
        private ViewBuilderFactoryInterface $viewBuilderFactory,
    ) {
    }

    public function configureNavigationItems(NavigationItemCollection $navigationItemCollection): void
    {
        $root = new NavigationItem('scale_videooptimizer.title');
        $root->setPosition(40);
        $root->setIcon('su-video');
        $root->setView(self::SETTINGS_VIEW);

        $videos = new NavigationItem('scale_videooptimizer.videos_nav');
        $videos->setPosition(10);
        $videos->setView(self::VIDEOS_VIEW);
        $root->addChild($videos);

        $libraries = new NavigationItem('scale_videooptimizer.libraries_nav');
        $libraries->setPosition(20);
        $libraries->setView(self::LIBRARIES_VIEW);
        $root->addChild($libraries);

        $settings = new NavigationItem('scale_videooptimizer.settings_nav');
        $settings->setPosition(30);
        $settings->setView(self::SETTINGS_VIEW);
        $root->addChild($settings);

        // Top-level navigation entry (own section with its own icon) — video management is a
        // primary editorial task, so it lives in the main left nav, not nested under Settings.
        $navigationItemCollection->add($root);
    }

    public function configureViews(ViewCollection $viewCollection): void
    {
        // Custom React views (registered in JS via viewRegistry) — see Resources/js.
        $viewCollection->add(
            $this->viewBuilderFactory
                ->createViewBuilder(self::SETTINGS_VIEW, '/videooptimizer/settings', 'scale_videooptimizer_settings')
        );

        $viewCollection->add(
            $this->viewBuilderFactory
                ->createViewBuilder(self::LIBRARIES_VIEW, '/videooptimizer/libraries', 'scale_videooptimizer_libraries')
        );

        $viewCollection->add(
            $this->viewBuilderFactory
                ->createViewBuilder(self::VIDEOS_VIEW, '/videooptimizer/videos', 'scale_videooptimizer_videos')
        );
    }
}
