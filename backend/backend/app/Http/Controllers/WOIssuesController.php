<?php

namespace App\Http\Controllers;

use App\Http\Requests\WOIssuesRequest;
use App\Repositories\All\WOIssues\WOIssuesInterface;
use App\Services\Accounting\PostingsService;
use App\Support\GlPostingRunner;

class WOIssuesController extends Controller
{
    public function __construct(
        private WOIssuesInterface $repo,
        protected ?PostingsService $postings = null
    ) {
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
    public function store(WOIssuesRequest $request)
    {
        $record = $this->repo->create($request->validated());

        return response()->json($record, 201);
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
    public function update(WOIssuesRequest $request, string $id)
    {
        $this->repo->update($id, $request->validated());

        $glWarning = null;
        if ($this->postings) {
            $run = GlPostingRunner::run(fn () => $this->postings->postWoIssue((int) $id));
            $glWarning = $run['gl_warning'];
        }

        return response()->json(GlPostingRunner::mergeWarning(['message' => 'Updated'], $glWarning));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        if ($this->postings) {
            $this->postings->deletePostedGl(28, (int) $id);
        }

        $this->repo->delete($id);

        return response()->json(['message' => 'Deleted']);
    }
}
