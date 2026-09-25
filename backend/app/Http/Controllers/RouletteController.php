<?php

namespace App\Http\Controllers;

use App\Http\Requests\SpinRequest;
use App\Domain\Games\Roulette\RouletteEngine;
use App\Enums\BetStatus;
use App\Enums\GameRoundStatus;
use App\Enums\GameType;
use App\Enums\WalletCurrency;
use App\Enums\WalletTransactionType;
use App\Models\Bet;
use App\Models\Game;
use App\Models\GameRound;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Services\ProvablyFair;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class RouletteController extends Controller
{
    public function spin(SpinRequest $request, Game $game)
    {
        abort_unless($game->is_active && $game->type === GameType::Roulette, 404);

        $user = $request->user();
        $bets = $request->input('bets');

        /*
         * Per-bet limit check, and precise total-stake sum - bcadd throughout,
         * never a float sum, for the same reason we've been careful everywhere else money is touched
         */
        $totalStake = '0.00';
        foreach ($bets as $bet) {
            if (
                bccomp((string) $bet['amount'], (string) $game->min_bet, 2) < 0
                || bccomp((string) $bet['amount'], (string) $game->max_bet, 2) > 0
            ) {
                throw ValidationException::withMessages([
                    'bets' => "Each bet must be between {$game->min_bet} and {$game->max_bet}.",
                ]);
            }

            $totalStake = bcadd($totalStake, (string) $bet['amount'], 2);
        }

        $wallet = $request->filled('wallet_id')
            ? $user->wallets()->findOrFail($request->input('wallet_id'))
            : $user->wallets()->where('currency', WalletCurrency::Demo)->firstOrFail();

        /*
         * The game's min_bet/max_bet carry no currency of their own, so without this
         * the same limits would be applied to a DEMO, USD and EUR wallet alike.
         */
        if (!$game->acceptsCurrency($wallet->currency)) {
            throw ValidationException::withMessages([
                'wallet_id' => "{$game->name} cannot be played with a {$wallet->currency->value} wallet.",
            ]);
        }

        $result = DB::transaction(function () use ($user, $game, $bets, $totalStake, $wallet, $request) {
            /*
             * Pessimistic lock, same pattern as WalletController::deposit
             */ 
            $lockedWallet = Wallet::where('id', $wallet->id)->lockForUpdate()->first();

            if (bccomp((string) $lockedWallet->balance, $totalStake, 2) < 0) {
                throw ValidationException::withMessages([
                    'bets' => 'Insufficient balance for this spin.',
                ]);
            }

            /*
             * Provably fair logic here: fresh server seed per round, nonce fixed at 0
             * (nonce exists in the schema for a future optimization - it will allow to reuse 
             * one server seed across several rounds and just to increment a nonce but for now
             * a fresh seed per round is simpler and equally valid)
             */
            $serverSeed = ProvablyFair::generateServerSeed();
            $clientSeed = $request->input('client_seed') ?: Str::random(16);
            $nonce = 0;
            $winningNumber = ProvablyFair::resolveNumber($serverSeed, $clientSeed, $nonce, 37);

            $round = new GameRound();
            $round->forceFill([
                'game_id' => $game->id,
                'user_id' => $user->id,
                'status' => GameRoundStatus::Completed,
                'server_seed' => $serverSeed,
                'server_seed_hash' => ProvablyFair::hashServerSeed($serverSeed),
                'client_seed' => $clientSeed,
                'nonce' => $nonce,
                'server_seed_revealed' => true,
                'result' => RouletteEngine::describeResult($winningNumber),
                'bets_closed_at' => now(),
                'resolved_at' => now(),
            ])->save();

            $runningBalance = $lockedWallet->balance;
            $createdBets = [];

            foreach ($bets as $betInput) {
                /*
                 * Debit the stake - one ledger entry per bet, linked via the
                 * polymorphic 'source' back to the bet itself.
                 */
                $balanceBeforeStake = $runningBalance;
                $runningBalance = bcsub((string) $runningBalance, (string) $betInput['amount'], 2);

                $bet = new Bet();
                $bet->forceFill([
                    'user_id' => $user->id,
                    'wallet_id' => $lockedWallet->id,
                    'game_round_id' => $round->id,
                    'bet_type' => $betInput['bet_type'],
                    'bet_value' => $betInput['bet_value'] ?? [],
                    'amount' => $betInput['amount'],
                    'status' => BetStatus::Placed,
                ])->save();

                (new WalletTransaction())->forceFill([
                    'wallet_id' => $lockedWallet->id,
                    'type' => WalletTransactionType::Bet,
                    'amount' => bcmul((string) $betInput['amount'], '-1', 2),
                    'balance_before' => $balanceBeforeStake,
                    'balance_after' => $runningBalance,
                    'source_type' => 'bet',
                    'source_id' => $bet->id,
                    'reference' => (string) Str::uuid(),
                ])->save();

                $won = RouletteEngine::isWinningBet(
                    $betInput['bet_type'],
                    $betInput['bet_value'] ?? [],
                    $winningNumber
                );
                $multiplier = RouletteEngine::multiplierFor($betInput['bet_type']);
                
                $payoutAmount = $won
                    ? bcmul((string) $betInput['amount'], (string) ($multiplier + 1), 2)
                    : '0.00';

                $bet->forceFill([
                    'status' => $won ? BetStatus::Won : BetStatus::Lost,
                    'payout_multiplier' => $multiplier,
                    'payout_amount' => $payoutAmount,
                ])->save();

                if ($won) {
                    $balanceBeforeWin = $runningBalance;
                    $runningBalance = bcadd((string) $runningBalance, $payoutAmount, 2);

                    (new WalletTransaction())->forceFill([
                        'wallet_id' => $lockedWallet->id,
                        'type' => WalletTransactionType::Win,
                        'amount' => $payoutAmount,
                        'balance_before' => $balanceBeforeWin,
                        'balance_after' => $runningBalance,
                        'source_type' => 'bet',
                        'source_id' => $bet->id,
                        'reference' => (string) Str::uuid(),
                    ])->save();
                }

                $createdBets[] = $bet;
            }

            $lockedWallet->forceFill(['balance' => $runningBalance])->save();

            return [
                'round' => $round,
                'bets' => $createdBets,
                'wallet' => $lockedWallet,
            ];
        });

        return response()->json([
            'round' => $result['round']->fresh()->makeVisible('server_seed'),
            'bets' => $result['bets'],
            'wallet' => $result['wallet'],
        ]);
    }
}