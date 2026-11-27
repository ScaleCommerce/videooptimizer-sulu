<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\EventListener;

use Scale\VideoOptimizerBundle\Security\VideoOptimizerPermissions;
use Sulu\Component\Security\Authorization\SecurityCheckerInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\ControllerEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Enforces the Sulu security contexts on the admin proxy routes: a route that names a requirement in
 * its `_vo_permission` default only runs for users who hold it. A malformed requirement denies.
 */
final class AdminPermissionListener implements EventSubscriberInterface
{
    public function __construct(private ?SecurityCheckerInterface $securityChecker = null)
    {
    }

    public static function getSubscribedEvents(): array
    {
        return [KernelEvents::CONTROLLER => 'onKernelController'];
    }

    public function onKernelController(ControllerEvent $event): void
    {
        $request = $event->getRequest();
        if (!$request->attributes->has(VideoOptimizerPermissions::ROUTE_DEFAULT) || null === $this->securityChecker) {
            return;
        }

        $alternatives = VideoOptimizerPermissions::parse($request->attributes->get(VideoOptimizerPermissions::ROUTE_DEFAULT));
        if (null !== $alternatives) {
            foreach ($alternatives as [$context, $permission]) {
                if ($this->securityChecker->hasPermission($context, $permission)) {
                    return;
                }
            }
        }

        $event->setController(static fn (): JsonResponse => new JsonResponse([
            'message' => 'You do not have permission for this VideoOptimizer action.',
            'code' => 'forbidden',
        ], 403));
    }
}
