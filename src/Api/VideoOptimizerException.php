<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Api;

class VideoOptimizerException extends \RuntimeException
{
    public function __construct(
        string $message,
        private int $statusCode = 0,
        ?\Throwable $previous = null,
    ) {
        parent::__construct($message, $statusCode, $previous);
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }
}
