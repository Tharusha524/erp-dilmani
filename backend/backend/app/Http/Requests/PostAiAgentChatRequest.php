<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PostAiAgentChatRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'messages' => 'required|array|min:1|max:20',
            'messages.*.role' => 'required|string|in:user,assistant',
            'messages.*.content' => 'required|string|max:4000',
            'context' => 'nullable|array',
            'context.pathname' => 'nullable|string|max:500',
            'context.page_title' => 'nullable|string|max:200',
            'context.module' => 'nullable|string|max:100',
            'context.user_role' => 'nullable|string|max:100',
            'context.language' => 'nullable|string|in:en,si,auto',
        ];
    }
}
