<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Backup extends Model
{
    use HasFactory;

    protected $fillable = [
        'file_name',
        'file_path',
        'size',
        'comments',
        'compression',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'size' => 'integer',
    ];

    // Accessor for human-readable size (e.g., "2.1 MB")
    public function getFormattedSizeAttribute(): string
    {
        $bytes = $this->size;
        $units = ['B', 'KB', 'MB', 'GB'];
        $size = $bytes;
        $unit = 'B';
        for ($i = 0; $size >= 1024 && $i < count($units) - 1; $i++) {
            $size /= 1024;
            $unit = $units[$i + 1];
        }
        return round($size, 1) . ' ' . $unit;
    }

    // Accessor for display name (e.g., "backup_2025-12-08.sql.gz")
    public function getDisplayNameAttribute(): string
    {
        $extension = $this->compression === 'none' ? '.sql' : '.' . $this->compression;
        return $this->file_name . $extension;
    }
}