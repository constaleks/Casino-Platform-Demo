<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\WalletTransaction;

class WalletTransactionController extends Controller
{
    public function index(Request $request)
    {
        $walletIds = $request->user()->wallets()->pluck('id');

        $transactions = WalletTransaction::whereIn('wallet_id', $walletIds)
            ->with('wallet:id,currency')
            ->latest()
            ->paginate(20);

        return response()->json($transactions);
    }
}
