<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoginSlideshowImage extends Model
{
    protected $fillable = ['path', 'sort_order'];

    protected $appends = ['url'];

    public function getUrlAttribute(): string
    {
        return url('api/storage-file/' . $this->path);
    }
}
