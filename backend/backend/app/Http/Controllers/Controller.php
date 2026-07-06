<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\PaginatesResourceIndex;

abstract class Controller
{
    use PaginatesResourceIndex;
}
