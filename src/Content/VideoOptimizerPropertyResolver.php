<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Content;

use Sulu\Content\Application\ContentResolver\Value\ContentView;
use Sulu\Content\Application\PropertyResolver\Resolver\PropertyResolverInterface;

/**
 * Resolves the `video_optimizer` content property for the website rendering.
 * The stored value is an array { uuid, libraryId, title, posterUrl }.
 */
class VideoOptimizerPropertyResolver implements PropertyResolverInterface
{
    public function resolve(mixed $data, string $locale, array $params = []): ContentView
    {
        if (!\is_array($data) || empty($data['uuid'])) {
            return ContentView::create(null, []);
        }

        return ContentView::create($data, []);
    }

    public static function getType(): string
    {
        return 'video_optimizer';
    }
}
