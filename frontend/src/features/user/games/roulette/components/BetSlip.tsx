import type { PendingBet } from '@/features/user/games/roulette/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const CHIP_PRESETS = [1, 5, 10, 25, 100];

interface BetSlipProps {
    pendingBets: PendingBet[];
    chipAmount: number;
    onChipAmountChange: (amount: number) => void;
    onRemoveBet: (key: string) => void;
    onClear: () => void;
    onSpin: () => void;
    isSpinning: boolean;
    /* Why the spin can't be sent yet (bet limits, decimals, balance...); null when it can */
    spinBlockedReason: string | null;
    className?: string;
}

export function BetSlip({
    pendingBets,
    chipAmount,
    onChipAmountChange,
    onRemoveBet,
    onClear,
    onSpin,
    isSpinning,
    spinBlockedReason,
    className,
}: BetSlipProps) {
    const totalStake = pendingBets.reduce((sum, bet) => sum + bet.amount, 0);

    return (
        <div className={cn('flex flex-col gap-4 rounded-lg border p-4', className)}>
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

            {/* min-h-0 + overflow: a long bet list scrolls inside the slip, never the page */}
            <div className="flex min-h-0 flex-1 flex-col">
                <p className="mb-2 text-sm font-medium">Your bets</p>
                {pendingBets.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Click the board to place bets, then spin.</p>
                ) : (
                    <ul className="flex min-h-0 flex-col gap-1 overflow-y-auto pr-1">
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

            {/* No message for the empty slip - the "Click the board" hint above already covers it */}
            {spinBlockedReason && pendingBets.length > 0 && (
                <p role="alert" className="-mb-2 text-xs text-destructive">
                    {spinBlockedReason}
                </p>
            )}

            <div className="flex items-center justify-between border-t pt-3">
                <span className="text-sm text-muted-foreground">
                    Total stake: <span className="font-semibold text-foreground">{totalStake.toFixed(2)}</span>
                </span>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={onClear} disabled={pendingBets.length === 0 || isSpinning}>
                        Clear
                    </Button>
                    <Button size="sm" onClick={onSpin} disabled={spinBlockedReason !== null || isSpinning}>
                        {isSpinning ? 'Spinning...' : 'Spin'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
