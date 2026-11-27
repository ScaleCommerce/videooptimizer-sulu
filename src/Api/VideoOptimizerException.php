<?php

declare(strict_types=1);

namespace Scale\VideoOptimizerBundle\Api;

class VideoOptimizerException extends \RuntimeException
{
    public function __construct(
        string $message,
        private int $statusCode = 0,
        ?\Throwable $previous = null,
        private ?string $apiCode = null,
    ) {
        parent::__construct($message, $statusCode, $previous);
    }

    /**
     * Machine-readable error code of the API (`data.code`), e.g. `source_url_video_platform`.
     */
    public function getApiCode(): ?string
    {
        return $this->apiCode;
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }
}
