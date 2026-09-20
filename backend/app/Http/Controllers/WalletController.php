<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Enums\WalletCurrency;
use Illuminate\Validation\ValidationException;
use App\Models\Wallet;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\QueryException;
use App\Models\WalletTransaction;
use App\Enums\WalletTransactionType;
use Illuminate\Support\Str;

class WalletController extends Controller
{
    public function index(Request $request)
    {
        return response()->json([
            'wallets' => $request->user()->wallets,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'currency' => ['required', Rule::in([WalletCurrency::Usd->value, WalletCurrency::Eur->value])],
        ]);

        $alreadyExists = $request->user()->wallets()
            ->where('currency', $validated['currency'])
            ->exists();

        if ($alreadyExists) {
            throw ValidationException::withMessages([
                'currency' => 'You already have a wallet in this currency.',
            ]);
        }

        try {
            $wallet = $request->user()->wallets()->create([
                'currency' => $validated['currency'],
            ]);
        } catch (QueryException $e) {
            /*
             * 23505 = PostgreSQL Unique Violation error.
             * This try/catch logic covers the race between the $alreadyExists check above
             * and this insert/create request (e.g. a double-submitted request).
             */
            if ($e->getCode() === '23505') {
                throw ValidationException::withMessages([
                    'currency' => 'You already have a wallet in this currency.',
                ]);
            }

            throw $e;
        }

        return response()->json(['wallet' => $wallet], 201);
    }

    /*
     * Use deposit() method here instead of store() on WalletTransactionController
     * because otherwise it would be a client-controlled write directly into the audit ledger.
     * It may build a door into the one table whose entire purpose is being a trustworthy, 
     * tamper-proof record of what happened to people's money. The ledger should only ever be written 
     * by trusted server-side logic.
     */
    public function deposit(Request $request, Wallet $wallet)
    {
        abort_if($wallet->user_id !== $request->user()->id, 403);

        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01', 'max:100000'],
        ]);

        $updatedWallet = DB::transaction(function () use ($wallet, $validated) {
            /*
            * Pessimistic lock - the pattern that is described in README.md file
            * Blocks any concurrent operation on this same wallet row until this transaction 
            * commits, preventing a lost-update race.
            */ 
            $lockedWallet = Wallet::where('id', $wallet->id)->lockForUpdate()->first();

            $balanceBefore = $lockedWallet->balance;

            /*
             * bcadd is a function from PHP's bcmath extension (configured in _docker/php/Dockerfile)
             * It does arbitrary-precision arithmetic on numbers represented as strings, rather than using 
             * PHP's native float/int types. It allows to avoid situations like this:
             * 
             * $balance = 0.1 + 0.2;
             * var_dump($balance === 0.3); // false
             */
            $balanceAfter = bcadd((string) $balanceBefore, (string) $validated['amount'], 2);

            $lockedWallet->forceFill(['balance' => $balanceAfter])->save();

            WalletTransaction::create([
                'wallet_id' => $lockedWallet->id,
                'type' => WalletTransactionType::Deposit,
                'amount' => $validated['amount'],
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'reference' => (string) Str::uuid(),
            ]);

            return $lockedWallet;
        });

        return response()->json(['wallet' => $updatedWallet]);
    }
}