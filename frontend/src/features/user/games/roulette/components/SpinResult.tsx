import type { Bet, GameRound } from '@/types/model';
import { cn } from '@/lib/utils';

interface SpinResultProps {
    round: GameRound;
    bets: Bet[];
}

const COLOR_CLASSES: Record<string, string> = {
    red: 'bg-red-600 text-white',
    black: 'bg-neutral-900 text-white',
    green: 'bg-green-700 text-white',
};

export function SpinResult({ round, bets }: SpinResultProps) {
    if (!round.result) return null;

    const totalPayout = bets.reduce((sum, bet) => sum + parseFloat(bet.payout_amount), 0);
    const netResult = totalPayout - bets.reduce((sum, bet) => sum + parseFloat(bet.amount), 0);

    return (
        <div className="flex flex-col gap-3 rounded-lg border p-4">
            <div className="flex items-center gap-3">
                <div
                    className={cn(
                        'flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold',
                        COLOR_CLASSES[round.result.color],
                    )}>
                    {round.result.number}
                </div>
                <div className="text-sm text-muted-foreground">
                    {round.result.color} · {round.result.parity ?? '—'} · {round.result.range ?? '—'}
                </div>
            </div>

            <ul className="flex flex-col gap-1 text-sm">
                {bets.map((bet) => (
                    <li key={bet.id} className="flex items-center justify-between">
                        <span>
                            {bet.bet_type} ({bet.amount})
                        </span>
                        <span className={bet.status === 'won' ? 'text-green-600' : 'text-muted-foreground'}>
                            {bet.status === 'won' ? `+${bet.payout_amount}` : 'Lost'}
                        </span>
                    </li>
                ))}
            </ul>

            <p className={cn('text-sm font-semibold', netResult >= 0 ? 'text-green-600' : 'text-destructive')}>
                Net: {netResult >= 0 ? '+' : ''}
                {netResult.toFixed(2)}
            </p>

            <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer">Verify fairness</summary>
                <p className="mt-1 break-all">Server seed hash: {round.server_seed_hash}</p>
                {round.server_seed && <p className="mt-1 break-all">Server seed: {round.server_seed}</p>}
                <p className="mt-1 break-all">Client seed: {round.client_seed}</p>
                <p className="mt-1">Nonce: {round.nonce}</p>
            </details>
        </div>
    );
}
