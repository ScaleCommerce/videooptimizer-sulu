<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Security;

use Sulu\Component\Security\Authorization\PermissionTypes;

/**
 * The Sulu security contexts of the bundle and the permission an admin proxy route needs.
 *
 * Routes name their requirement in the `_vo_permission` route default as `context:permission`;
 * alternatives are separated by `|` (any one of them is enough), e.g. `videos:view|libraries:view`.
 */
final class VideoOptimizerPermissions
{
    public const VIDEOS = 'sulu.videooptimizer.videos';
    public const LIBRARIES = 'sulu.videooptimizer.libraries';
    public const SETTINGS = 'sulu.videooptimizer.settings';

    /** Route default holding the requirement. */
    public const ROUTE_DEFAULT = '_vo_permission';

    /** Short names used in route defaults and in the admin config. */
    public const CONTEXTS = [
        'videos' => self::VIDEOS,
        'libraries' => self::LIBRARIES,
        'settings' => self::SETTINGS,
    ];

    /**
     * @return array<string, list<string>> permission types per security context
     */
    public static function contexts(): array
    {
        $crud = [PermissionTypes::VIEW, PermissionTypes::ADD, PermissionTypes::EDIT, PermissionTypes::DELETE];

        return [
            self::VIDEOS => $crud,
            self::LIBRARIES => $crud,
            self::SETTINGS => [PermissionTypes::VIEW, PermissionTypes::EDIT],
        ];
    }

    /**
     * Parses a route requirement into [context, permission] alternatives; null when it is malformed
     * (callers must deny then).
     *
     * @return list<array{0: string, 1: string}>|null
     */
    public static function parse(mixed $requirement): ?array
    {
        if (!\is_string($requirement) || '' === $requirement) {
            return null;
        }

        $alternatives = [];
        foreach (explode('|', $requirement) as $part) {
            $pair = explode(':', $part);
            if (2 !== \count($pair) || !isset(self::CONTEXTS[$pair[0]]) || !\in_array($pair[1], self::contexts()[self::CONTEXTS[$pair[0]]], true)) {
                return null;
            }
            $alternatives[] = [self::CONTEXTS[$pair[0]], $pair[1]];
        }

        return $alternatives;
    }
}
