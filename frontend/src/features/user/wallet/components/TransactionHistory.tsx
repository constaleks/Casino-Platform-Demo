import { useEffect, useState, useTransition } from 'react';
import { fetchWalletTransactions } from '@/api/user/walletTransactions';
import type { WalletTransaction } from '@/types/model';
import { Button } from '@/components/ui/button';

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
        return <p className="text-muted-foreground">Loading transactions...</p>;
    }

    if (transactions.length === 0) {
        return <p className="text-muted-foreground">No transactions yet.</p>;
    }

    return (
        <div className="flex flex-col gap-3">
            <div className={`overflow-x-auto rounded-lg border transition-opacity ${isPending ? 'opacity-60' : ''}`}>
                <table className="w-full text-sm">
                    <thead className="border-b bg-muted/50">
                        <tr>
                            <th className="p-3 text-left">Date</th>
                            <th className="p-3 text-left">Type</th>
                            <th className="p-3 text-left">Currency</th>
                            <th className="p-3 text-right">Amount</th>
                            <th className="p-3 text-right">Balance After</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((tx) => (
                            <tr key={tx.id} className="border-b last:border-0">
                                <td className="p-3">{new Date(tx.created_at).toLocaleString()}</td>
                                <td className="p-3 capitalize">{tx.type}</td>
                                <td className="p-3">{tx.wallet?.currency ?? '—'}</td>
                                <td className="p-3 text-right">
                                    {parseFloat(tx.amount) >= 0 ? '+' : ''}
                                    {parseFloat(tx.amount).toFixed(2)}
                                </td>
                                <td className="p-3 text-right">{parseFloat(tx.balance_after).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {lastPage > 1 && (
                <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm" disabled={isPending || page <= 1} onClick={() => setPage((p) => p - 1)}>
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {page} of {lastPage}
                    </span>
                    <Button variant="outline" size="sm" disabled={isPending || page >= lastPage} onClick={() => setPage((p) => p + 1)}>
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}
