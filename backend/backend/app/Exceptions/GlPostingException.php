<?php

namespace App\Exceptions;

/**
 * Raised when a transaction saved but GL lines could not be posted (missing accounts, unbalanced, etc.).
 */
class GlPostingException extends \RuntimeException
{
}
