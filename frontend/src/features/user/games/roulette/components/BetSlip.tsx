import type { PendingBet } from '@/features/user/games/roulette/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const CHIP_PRESETS = [1, 5, 10, 25, 100];

interface BetSlipProps {
    pendingBets: PendingBet[];
    chipAmount: number;
    onChipAmountChange: (amount: number) => void;
    onRemoveBet: (key: string) => void;
    onClear: () => void;
    onSpin: () => void;
    isSpinning: boolean;
}

export function BetSlip({ pendingBets, chipAmount, onChipAmountChange, onRemoveBet, onClear, onSpin, isSpinning }: BetSlipProps) {
    const totalStake = pendingBets.reduce((sum, bet) => sum + bet.amount, 0);

    return (
        <div className="flex flex-col gap-4 rounded-lg border p-4">
            <div>
                <p className="mb-2 text-sm font-medium">Chip amount</p>
                <div className="flex flex-wrap gap-2">
                    {CHIP_PRESETS.map((preset) => (
                        <button
                            key={preset}
                            type="button"
                            onClick={() => onChipAmountChange(preset)}
                            className={`rounded-full border px-3 py-1 text-sm ${
                                chipAmount === preset ? 'border-primary bg-primary/10 font-semibold' : ''
                            }`}>
                            {preset}
                        </button>
                    ))}
                    <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        className="w-24"
                        value={chipAmount}
                        onChange={(e) => onChipAmountChange(parseFloat(e.target.value) || 0)}
                    />
                </div>
            </div>

            <div>
                <p className="mb-2 text-sm font-medium">Your bets</p>
                {pendingBets.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Click the board to place bets, then spin.</p>
                ) : (
                    <ul className="flex flex-col gap-1">
                        {pendingBets.map((bet) => (
                            <li key={bet.key} className="flex items-center justify-between text-sm">
                                <span>
                                    {bet.label} — {bet.amount.toFixed(2)}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => onRemoveBet(bet.key)}
                                    className="text-muted-foreground hover:text-destructive">
                                    x
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="flex items-center justify-between border-t pt-3">
                <span className="text-sm text-muted-foreground">
                    Total stake: <span className="font-semibold text-foreground">{totalStake.toFixed(2)}</span>
                </span>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={onClear} disabled={pendingBets.length === 0 || isSpinning}>
                        Clear
                    </Button>
                    <Button size="sm" onClick={onSpin} disabled={pendingBets.length === 0 || isSpinning}>
                        {isSpinning ? 'Spinning...' : 'Spin'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
