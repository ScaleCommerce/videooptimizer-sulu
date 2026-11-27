<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Prophecy\Argument;
use Prophecy\PhpUnit\ProphecyTrait;
use Scale\VideoOptimizerBundle\Admin\VideoOptimizerAdmin;
use Scale\VideoOptimizerBundle\EventListener\AdminPermissionListener;
use Scale\VideoOptimizerBundle\Security\VideoOptimizerPermissions;
use Sulu\Bundle\AdminBundle\Admin\Navigation\NavigationItemCollection;
use Sulu\Bundle\AdminBundle\Admin\View\ViewBuilderFactoryInterface;
use Sulu\Bundle\AdminBundle\Admin\View\ViewCollection;
use Sulu\Component\Security\Authorization\SecurityCheckerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Event\ControllerEvent;
use Symfony\Component\HttpKernel\HttpKernelInterface;
use Symfony\Component\HttpKernel\KernelInterface;
use Symfony\Component\Yaml\Yaml;

final class AdminPermissionsTest extends TestCase
{
    use ProphecyTrait;

    public function testEveryAdminRouteNamesAValidRequirement(): void
    {
        /** @var array<string, array<string, mixed>> $routes */
        $routes = Yaml::parseFile(\dirname(__DIR__, 2) . '/src/Resources/config/routing_admin.yaml');
        self::assertGreaterThan(30, \count($routes));

        foreach ($routes as $name => $route) {
            self::assertIsArray($route['defaults'] ?? null, $name . ' has no defaults');
            self::assertNotNull(VideoOptimizerPermissions::parse($route['defaults'][VideoOptimizerPermissions::ROUTE_DEFAULT] ?? null), $name . ' has no valid _vo_permission');
        }
    }

    public function testWritingRoutesNeedMoreThanView(): void
    {
        /** @var array<string, array<string, mixed>> $routes */
        $routes = Yaml::parseFile(\dirname(__DIR__, 2) . '/src/Resources/config/routing_admin.yaml');
        foreach ($routes as $name => $route) {
            $methods = $route['methods'] ?? [];
            $requirement = (string) $route['defaults'][VideoOptimizerPermissions::ROUTE_DEFAULT];
            if (['GET'] !== $methods && 'scale_videooptimizer_settings_get' !== $name) {
                self::assertStringNotContainsString(':view', $requirement, $name . ' writes with a view permission');
            }
        }
        self::assertSame('libraries:delete', $routes['scale_videooptimizer_libraries_delete']['defaults']['_vo_permission']);
        self::assertSame('settings:edit', $routes['scale_videooptimizer_settings_webhook_secret_delete']['defaults']['_vo_permission']);
    }

    public function testParse(): void
    {
        self::assertSame([[VideoOptimizerPermissions::VIDEOS, 'view'], [VideoOptimizerPermissions::LIBRARIES, 'view']], VideoOptimizerPermissions::parse('videos:view|libraries:view'));
        foreach ([null, '', 'videos', 'videos:fly', 'nope:view', 'settings:delete', 'videos:view|x:y', 'videos:view:edit'] as $bad) {
            self::assertNull(VideoOptimizerPermissions::parse($bad), (string) json_encode($bad));
        }
    }

    public function testListenerReplacesTheControllerWith403WithoutPermission(): void
    {
        $event = $this->event(['_vo_permission' => 'libraries:delete']);
        $checker = $this->prophesize(SecurityCheckerInterface::class);
        $checker->hasPermission(VideoOptimizerPermissions::LIBRARIES, 'delete')->willReturn(false);

        (new AdminPermissionListener($checker->reveal()))->onKernelController($event);

        $response = ($event->getController())();
        self::assertInstanceOf(JsonResponse::class, $response);
        self::assertSame(403, $response->getStatusCode());
        self::assertSame('forbidden', json_decode((string) $response->getContent(), true)['code']);
    }

    public function testListenerLetsPermittedAndUnrestrictedRequestsThrough(): void
    {
        $checker = $this->prophesize(SecurityCheckerInterface::class);
        $checker->hasPermission(VideoOptimizerPermissions::VIDEOS, 'view')->willReturn(false);
        $checker->hasPermission(VideoOptimizerPermissions::LIBRARIES, 'view')->willReturn(true);
        $listener = new AdminPermissionListener($checker->reveal());

        $event = $this->event(['_vo_permission' => 'videos:view|libraries:view']);
        $original = $event->getController();
        $listener->onKernelController($event);
        self::assertSame($original, $event->getController(), 'any one alternative is enough');

        $event = $this->event([]);
        $original = $event->getController();
        $listener->onKernelController($event);
        self::assertSame($original, $event->getController(), 'other routes are not touched');
    }

    public function testListenerDeniesAMalformedRequirement(): void
    {
        $event = $this->event(['_vo_permission' => 'videos:fly']);
        $checker = $this->prophesize(SecurityCheckerInterface::class);
        $checker->hasPermission(Argument::cetera())->willReturn(true);

        (new AdminPermissionListener($checker->reveal()))->onKernelController($event);

        self::assertSame(403, ($event->getController())()->getStatusCode());
    }

    public function testAdminRegistersTheSecurityContexts(): void
    {
        $contexts = $this->admin(null)->getSecurityContexts();

        self::assertSame(['view', 'add', 'edit', 'delete'], $contexts['Sulu']['VideoOptimizer'][VideoOptimizerPermissions::VIDEOS]);
        self::assertSame(['view', 'edit'], $contexts['Sulu']['VideoOptimizer'][VideoOptimizerPermissions::SETTINGS]);
        self::assertArrayHasKey(VideoOptimizerPermissions::LIBRARIES, $contexts['Sulu']['VideoOptimizer']);
    }

    public function testNavigationAndViewsFollowTheViewPermission(): void
    {
        $checker = $this->prophesize(SecurityCheckerInterface::class);
        $checker->hasPermission(Argument::cetera())->willReturn(false);
        $checker->hasPermission(VideoOptimizerPermissions::LIBRARIES, 'view')->willReturn(true);
        $admin = $this->admin($checker->reveal());

        $navigation = new NavigationItemCollection();
        $admin->configureNavigationItems($navigation);
        $root = array_values($navigation->all())[0];
        self::assertCount(1, $root->getChildren());
        self::assertSame(VideoOptimizerAdmin::LIBRARIES_VIEW, $root->getView());

        $views = new ViewCollection();
        $admin->configureViews($views);
        self::assertSame([VideoOptimizerAdmin::LIBRARIES_VIEW], array_keys($views->all()));
    }

    public function testNoNavigationWithoutAnyViewPermissionAndEverythingWithoutAChecker(): void
    {
        $checker = $this->prophesize(SecurityCheckerInterface::class);
        $checker->hasPermission(Argument::cetera())->willReturn(false);
        $navigation = new NavigationItemCollection();
        $this->admin($checker->reveal())->configureNavigationItems($navigation);
        self::assertSame([], $navigation->all());

        $navigation = new NavigationItemCollection();
        $this->admin(null)->configureNavigationItems($navigation);
        self::assertCount(3, array_values($navigation->all())[0]->getChildren());
    }

    public function testConfigExposesThePermissionsToTheAdminUi(): void
    {
        $checker = $this->prophesize(SecurityCheckerInterface::class);
        $checker->hasPermission(Argument::cetera())->willReturn(false);
        $checker->hasPermission(VideoOptimizerPermissions::VIDEOS, 'view')->willReturn(true);
        $admin = $this->admin($checker->reveal());

        self::assertSame('scale_videooptimizer', $admin->getConfigKey());
        $permissions = $admin->getConfig()['permissions'];
        self::assertTrue($permissions['videos']['view']);
        self::assertFalse($permissions['videos']['delete']);
        self::assertFalse($permissions['settings']['edit']);
        self::assertArrayNotHasKey('delete', $permissions['settings']);
    }

    private function admin(?SecurityCheckerInterface $checker): VideoOptimizerAdmin
    {
        $factory = $this->prophesize(ViewBuilderFactoryInterface::class);
        $factory->createViewBuilder(Argument::cetera())->will(fn (array $args) => new \Sulu\Bundle\AdminBundle\Admin\View\ViewBuilder($args[0], $args[1], $args[2]));

        return new VideoOptimizerAdmin($factory->reveal(), $checker);
    }

    /**
     * @param array<string, mixed> $attributes
     */
    private function event(array $attributes): ControllerEvent
    {
        return new ControllerEvent(
            $this->prophesize(KernelInterface::class)->reveal(),
            static fn () => new JsonResponse([]),
            new Request(attributes: $attributes),
            HttpKernelInterface::MAIN_REQUEST,
        );
    }
}
