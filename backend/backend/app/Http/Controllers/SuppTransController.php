<?php

namespace App\Http\Controllers;

use App\Http\Requests\SuppTransRequest;
use App\Repositories\All\SuppTrans\SuppTransInterface;
use App\Services\Accounting\PostingsService;
use App\Support\GlPostingRunner;

class SuppTransController extends Controller
{
    protected SuppTransInterface $repo;

    public function __construct(SuppTransInterface $repo, protected ?PostingsService $postings = null)
    {
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
    public function store(SuppTransRequest $request)
    {
        $record = $this->repo->create($request->validated());

        $glWarning = null;
        if ($this->postings) {
            $type = (int) ($record->trans_type ?? 0);
            if ($type === 20 || $type === 21) {
                $run = GlPostingRunner::run(fn () => $this->postings->repostSuppTrans($record));
                $glWarning = $run['gl_warning'];
            }
        }

        return response()->json(GlPostingRunner::mergeWarning($record instanceof \Illuminate\Database\Eloquent\Model ? $record->toArray() : (array) $record, $glWarning));
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $record = $this->repo->find($id);
        return response()->json($record);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(SuppTransRequest $request, string $id)
    {
        $this->repo->update($id, $request->validated());
        $glWarning = null;

        if ($this->postings) {
            $record = $this->repo->find($id);
            if ($record) {
                $type = (int) ($record->trans_type ?? 0);
                if ($type === 20 || $type === 21) {
                    $run = GlPostingRunner::run(fn () => $this->postings->repostSuppTrans($record));
                    $glWarning = $run['gl_warning'];
                }
            }
        }

        return response()->json(GlPostingRunner::mergeWarning(['message' => 'Updated successfully'], $glWarning));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $record = $this->repo->find($id);
        if ($record && $this->postings) {
            $type = (int) ($record->trans_type ?? 0);
            $no = (int) ($record->trans_no ?? 0);
            if ($no > 0 && in_array($type, [20, 21, 22], true)) {
                $this->postings->deletePostedGl($type, $no);
            }
        }

        $this->repo->delete($id);

        return response()->json(['message' => 'Deleted successfully']);
    }
}
