<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Tags which card brand (Visa, Mastercard, ...) a payment used — a
 * reporting label only, written after a sale is already posted. Never
 * read by invoice posting or GL logic.
 */
class PosPaymentCardType extends Model
{
    protected $table = 'pos_payment_card_types';

    protected $fillable = [
        'debtor_trans_no',
        'debtor_trans_type',
        'bank_account_id',
        'card_type_id',
    ];

    public function cardType()
    {
        return $this->belongsTo(CardType::class);
    }
}
