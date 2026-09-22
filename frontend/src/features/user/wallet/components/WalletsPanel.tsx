import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchWallets } from '@/api/user/wallets';
import type { Wallet } from '@/types/model';

const ADDABLE_CURRENCIES: Array<'USD' | 'EUR'> = ['USD', 'EUR'];

export function WalletsPanel() {
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let ignore = false;

        fetchWallets()
            .then((data) => {
                if (!ignore) setWallets(data);
            })
            .finally(() => {
                if (!ignore) setIsLoading(false);
            });

        return () => {
            ignore = true;
        };
    }, []);

    const existingCurrencies = new Set(wallets.map((w) => w.currency));
    const canAddWallet = ADDABLE_CURRENCIES.some((c) => !existingCurrencies.has(c));

    if (isLoading) {
        return <p className="text-muted-foreground">Loading wallets...</p>;
    }

    return (
        <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-center">Wallets</h2>

            <div className="flex flex-col gap-3">
                {wallets.map((wallet) => (
                    <div key={wallet.id} className="flex flex-col gap-3 rounded-lg border p-4">
                        <div className="text-center">
                            <p className="font-medium">{wallet.currency}</p>
                            <p className="text-2xl font-bold">{parseFloat(wallet.balance).toFixed(2)}</p>
                        </div>

                        <Link
                            to={`/wallets/${wallet.id}/deposit`}
                            className="rounded-md border bg-background px-3 py-1.5 text-center text-sm font-medium transition-colors hover:bg-muted">
                            Deposit
                        </Link>
                    </div>
                ))}
            </div>

            {canAddWallet && (
                <Link
                    to="/wallets/new"
                    className="rounded-lg border border-dashed p-4 text-center text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
                    + Add wallet
                </Link>
            )}
        </div>
    );
}
