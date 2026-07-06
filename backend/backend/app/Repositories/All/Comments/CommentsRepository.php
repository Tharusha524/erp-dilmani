<?php

namespace App\Repositories\All\Comments;

use App\Models\Comment;
use App\Repositories\Base\BaseRepository;

class CommentsRepository extends BaseRepository implements CommentsInterface
{
    public function __construct(Comment $model)
    {
        parent::__construct($model);
    }

    // Add any custom logic for comments here if needed
}
