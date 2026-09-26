import { UserLayout } from '@/components/layout/UserLayout';
import { RouletteBoard } from '@/features/user/games/roulette/components/RouletteBoard';
import { BetSlip } from '@/features/user/games/roulette/components/BetSlip';
import { SpinResult } from '@/features/user/games/roulette/components/SpinResult';

import { useState } from 'react';
import { isAxiosError } from 'axios';
import { spinRoulette } from '@/api/user/roulette';
import { useAuthStore } from '@/features/user/auth/authStore';
import { betKey, type PendingBet } from '@/features/user/games/roulette/utils';
import type { Bet, GameRound } from '@/types/model';

const GAME_SLUG = 'european-roulette';

export function RoulettePage() {
    const [pendingBets, setPendingBets] = useState<PendingBet[]>([]);
    const [chipAmount, setChipAmount] = useState(1);
    const [isSpinning, setIsSpinning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastRound, setLastRound] = useState<GameRound | null>(null);
    const [lastBets, setLastBets] = useState<Bet[]>([]);
    const refreshAuthUser = useAuthStore((s) => s.fetchCurrentUser);

    function handleBoardBet(betType: string, betValue: Record<string, unknown>, label: string) {
        if (chipAmount <= 0) {
            setError('Choose a chip amount first.');
            return;
        }
        setError(null);

        const key = betKey(betType, betValue);
        setPendingBets((prev) => {
            const existing = prev.find((b) => b.key === key);
            if (existing) {
                return prev.map((b) => (b.key === key ? { ...b, amount: b.amount + chipAmount } : b));
            }
            return [...prev, { key, bet_type: betType, bet_value: betValue, amount: chipAmount, label }];
        });
    }

    function handleRemoveBet(key: string) {
        setPendingBets((prev) => prev.filter((b) => b.key !== key));
    }

    async function handleSpin() {
        setError(null);
        setIsSpinning(true);

        try {
            const response = await spinRoulette(
                GAME_SLUG,
                pendingBets.map((b) => ({ bet_type: b.bet_type, bet_value: b.bet_value, amount: b.amount })),
            );
            setLastRound(response.round);
            setLastBets(response.bets);
            setPendingBets([]);
            await refreshAuthUser();
        } catch (err) {
            if (isAxiosError<{ message?: string }>(err)) {
                setError(err.response?.data?.message ?? 'Spin failed. Please try again.');
            } else {
                setError('Spin failed. Please try again.');
            }
        } finally {
            setIsSpinning(false);
        }
    }

    return (
        <UserLayout>
            <div className="mx-auto flex max-w-3xl flex-col gap-6">
                <h1 className="text-2xl font-bold">European Roulette</h1>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <RouletteBoard onBet={handleBoardBet} disabled={isSpinning} />

                <BetSlip
                    pendingBets={pendingBets}
                    chipAmount={chipAmount}
                    onChipAmountChange={setChipAmount}
                    onRemoveBet={handleRemoveBet}
                    onClear={() => setPendingBets([])}
                    onSpin={handleSpin}
                    isSpinning={isSpinning}
                />

                {lastRound && <SpinResult round={lastRound} bets={lastBets} />}
            </div>
        </UserLayout>
    );
}
