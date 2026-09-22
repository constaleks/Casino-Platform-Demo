import { useEffect, useState, useTransition } from 'react';
import { cn } from 'cn';
import { fetchWalletTransactions } from '@/api/user/walletTransactions';
import type { WalletTransaction } from '@/types/model';
import { Skeleton } from '@/components/user/Loading';
import { formatAmount } from '../currency';

// Ledger amounts are always stored positive; the type decides the direction.
const CREDIT_TYPES: Array<WalletTransaction['type']> = ['deposit', 'win', 'refund', 'bonus'];

const TYPE_BADGE: Record<WalletTransaction['type'], string> = {
    deposit: 'border-win/25 bg-win/10 text-win',
    withdrawal: 'border-chip-red/25 bg-chip-red/10 text-chip-red',
    bet: 'border-white/15 bg-white/5 text-white/60',
    win: 'border-gold/25 bg-gold/10 text-gold',
    refund: 'border-chip-blue/25 bg-chip-blue/10 text-chip-blue',
    bonus: 'border-chip-purple/25 bg-chip-purple/10 text-chip-purple',
};

export function TransactionHistory() {
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        let ignore = false;

        startTransition(async () => {
            const res = await fetchWalletTransactions(page);
            if (!ignore) {
                setTransactions(res.data);
                setLastPage(res.last_page);
            }
        });

        return () => {
            ignore = true;
        };
    }, [page]);

    if (isPending && transactions.length === 0) {
        return (
            <div className="flex flex-col gap-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-14 rounded-xl" />
                ))}
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center">
                <p className="text-4xl">🎲</p>
                <p className="mt-3 font-bold">No transactions yet</p>
                <p className="mt-1 text-sm text-white/40">Deposit into a wallet or place your first bet to get started.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div
                className={cn(
                    'overflow-x-auto rounded-2xl border border-white/8 bg-felt-800/50 transition-opacity',
                    isPending && 'opacity-50'
                )}>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/8">
                            {['Date', 'Type', 'Currency'].map((heading) => (
                                <th
                                    key={heading}
                                    className="p-3 text-left text-[10px] font-bold tracking-[0.18em] text-white/35 uppercase">
                                    {heading}
                                </th>
                            ))}
                            {['Amount', 'Balance after'].map((heading) => (
                                <th
                                    key={heading}
                                    className="p-3 text-right text-[10px] font-bold tracking-[0.18em] text-white/35 uppercase">
                                    {heading}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {transactions.map((tx) => {
                            const isCredit = CREDIT_TYPES.includes(tx.type);

                            return (
                                <tr
                                    key={tx.id}
                                    className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/5">
                                    <td className="p-3 whitespace-nowrap text-white/50">
                                        {new Date(tx.created_at).toLocaleString(undefined, {
                                            dateStyle: 'medium',
                                            timeStyle: 'short',
                                        })}
                                    </td>
                                    <td className="p-3">
                                        <span
                                            className={cn(
                                                'inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-[0.12em] uppercase',
                                                TYPE_BADGE[tx.type]
                                            )}>
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td className="p-3 font-semibold text-white/70">{tx.wallet?.currency ?? '—'}</td>
                                    <td
                                        className={cn(
                                            'p-3 text-right font-bold tabular-nums',
                                            isCredit ? 'text-win' : 'text-chip-red'
                                        )}>
                                        {isCredit ? '+' : '−'}
                                        {formatAmount(tx.amount)}
                                    </td>
                                    <td className="p-3 text-right font-semibold text-white/60 tabular-nums">
                                        {formatAmount(tx.balance_after)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {lastPage > 1 && (
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        disabled={isPending || page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                        className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold tracking-[0.14em] text-white/70 uppercase transition-colors not-disabled:hover:border-gold/30 not-disabled:hover:text-gold disabled:cursor-not-allowed disabled:opacity-35">
                        ← Prev
                    </button>

                    <span className="text-xs font-semibold text-white/40 tabular-nums">
                        Page {page} <span className="text-white/20">of</span> {lastPage}
                    </span>

                    <button
                        type="button"
                        disabled={isPending || page >= lastPage}
                        onClick={() => setPage((p) => p + 1)}
                        className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold tracking-[0.14em] text-white/70 uppercase transition-colors not-disabled:hover:border-gold/30 not-disabled:hover:text-gold disabled:cursor-not-allowed disabled:opacity-35">
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}
