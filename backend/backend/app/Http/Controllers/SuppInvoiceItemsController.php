<?php

namespace App\Http\Controllers;

use App\Http\Requests\SuppInvoiceItemsRequest;
use App\Repositories\All\SuppInvoiceItems\SuppInvoiceItemsInterface;
use App\Services\Accounting\PostingsService;
use App\Support\GlPostingRunner;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SuppInvoiceItemsController extends Controller
{
    private SuppInvoiceItemsInterface $suppInvoiceItems;

    public function __construct(
        SuppInvoiceItemsInterface $suppInvoiceItems,
        protected ?PostingsService $postings = null
    ) {
        $this->suppInvoiceItems = $suppInvoiceItems;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json($this->suppInvoiceItems->all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(SuppInvoiceItemsRequest $request)
    {
        $validated = $request->validated();
        $item = $this->suppInvoiceItems->create($validated);
        $glWarning = $this->repostSuppFromItem($validated);

        return response()->json(GlPostingRunner::mergeWarning($item instanceof \Illuminate\Database\Eloquent\Model ? $item->toArray() : (array) $item, $glWarning), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return response()->json($this->suppInvoiceItems->find($id));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(SuppInvoiceItemsRequest $request, string $id)
    {
        $validated = $request->validated();
        $this->suppInvoiceItems->update($id, $validated);
        $glWarning = $this->repostSuppFromItem($validated);

        return response()->json(GlPostingRunner::mergeWarning(['message' => 'Updated'], $glWarning));
    }

    public function destroy(string $id)
    {
        $record = $this->suppInvoiceItems->find($id);
        $this->suppInvoiceItems->delete($id);
        if ($record) {
            $glWarning = $this->repostSuppFromItem([
                'supp_trans_no' => $record->supp_trans_no ?? null,
                'supp_trans_type' => $record->supp_trans_type ?? 20,
            ]);
        }

        return response()->json(GlPostingRunner::mergeWarning(['message' => 'Deleted'], $glWarning ?? null));
    }

    private function repostSuppFromItem(array $data): ?string
    {
        if (! $this->postings || empty($data['supp_trans_no'])) {
            return null;
        }

        $transType = (int) ($data['supp_trans_type'] ?? 20);
        $transNo = (int) $data['supp_trans_no'];
        if ($transNo <= 0) {
            return null;
        }

        $row = Schema::hasTable('supp_trans')
            ? DB::table('supp_trans')
                ->where('trans_type', $transType)
                ->where('trans_no', $transNo)
                ->first()
            : null;

        if (! $row) {
            return null;
        }

        $run = GlPostingRunner::run(fn () => $this->postings->repostSuppTrans($row));

        return $run['gl_warning'];
    }
}
