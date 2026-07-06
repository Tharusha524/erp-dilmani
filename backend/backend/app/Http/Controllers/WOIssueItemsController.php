<?php

namespace App\Http\Controllers;

use App\Http\Requests\WOIssueItemsRequest;
use App\Repositories\All\WOIssueItems\WOIssueItemsInterface;
use App\Services\Accounting\PostingsService;
use App\Support\GlPostingRunner;

class WOIssueItemsController extends Controller
{
    private WOIssueItemsInterface $repo;

    public function __construct(
        WOIssueItemsInterface $repo,
        protected ?PostingsService $postings = null
    ) {
        $this->repo = $repo;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json($this->repo->all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(WOIssueItemsRequest $request)
    {
        $validated = $request->validated();
        $item = $this->repo->create($validated);

        $glWarning = null;
        if ($this->postings && ! empty($validated['issue_id'])) {
            $run = GlPostingRunner::run(fn () => $this->postings->postWoIssue((int) $validated['issue_id']));
            $glWarning = $run['gl_warning'];
        }

        return response()->json(GlPostingRunner::mergeWarning($item instanceof \Illuminate\Database\Eloquent\Model ? $item->toArray() : (array) $item, $glWarning), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return response()->json($this->repo->find($id));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(WOIssueItemsRequest $request, string $id)
    {
        $existing = $this->repo->find($id);
        $validated = $request->validated();
        $this->repo->update($id, $validated);
        $glWarning = $this->repostWoIssueFromItem($existing, $validated);

        return response()->json(GlPostingRunner::mergeWarning(['message' => 'Updated'], $glWarning));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $existing = $this->repo->find($id);
        $this->repo->delete($id);
        $glWarning = $this->repostWoIssueFromItem($existing, []);

        return response()->json(GlPostingRunner::mergeWarning(['message' => 'Deleted'], $glWarning));
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function repostWoIssueFromItem($record, array $validated): ?string
    {
        if (! $this->postings) {
            return null;
        }

        $issueId = (int) ($validated['issue_id'] ?? $record->issue_id ?? 0);
        if ($issueId <= 0) {
            return null;
        }

        $run = GlPostingRunner::run(fn () => $this->postings->postWoIssue($issueId));

        return $run['gl_warning'];
    }
}
