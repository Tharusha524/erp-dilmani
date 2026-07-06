<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EntityAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'entity_type',
        'entity_id',
        'doc_title',
        'doc_date',
        'stored_path',
        'original_filename',
        'mime_type',
        'size',
        'inactive',
    ];

    protected $casts = [
        'doc_date' => 'date',
        'inactive' => 'boolean',
        'size' => 'integer',
    ];

    protected $appends = ['download_url', 'filetype', 'formatted_size'];

    public function getDownloadUrlAttribute(): string
    {
        return url('/api/entity-attachments/' . $this->id . '/download');
    }

    public function getFiletypeAttribute(): string
    {
        $ext = pathinfo($this->original_filename ?? '', PATHINFO_EXTENSION);

        return $ext ? strtoupper($ext) : '';
    }

    public function getFormattedSizeAttribute(): string
    {
        $bytes = (int) $this->size;
        if ($bytes < 1024) {
            return $bytes . ' B';
        }
        if ($bytes < 1048576) {
            return round($bytes / 1024, 1) . ' KB';
        }

        return round($bytes / 1048576, 1) . ' MB';
    }
}
