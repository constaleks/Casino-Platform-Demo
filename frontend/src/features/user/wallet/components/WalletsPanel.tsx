import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from 'cn';
import { fetchWallets } from '@/api/user/wallets';
import type { Wallet } from '@/types/model';
import { Skeleton } from '@/components/user/Loading';
import { CURRENCY_META, formatAmount } from '../currency';

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

    return (
        <section className="flex flex-col gap-3">
            <header className="flex items-baseline justify-between px-1">
                <h2 className="text-[11px] font-bold tracking-[0.22em] text-white/40 uppercase">Wallets</h2>
                {!isLoading && <span className="text-[11px] font-semibold text-white/30">{wallets.length}</span>}
            </header>

            {isLoading ? (
                <div className="flex flex-col gap-3">
                    {[0, 1, 2].map((i) => (
                        <Skeleton key={i} className="h-[104px] rounded-2xl" />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {wallets.map((wallet) => {
                        const meta = CURRENCY_META[wallet.currency];
                        const locked = parseFloat(wallet.locked_balance);

                        return (
                            <article
                                key={wallet.id}
                                className="group relative overflow-hidden rounded-2xl border border-white/8 bg-felt-800/70 p-3 transition-all hover:-translate-y-0.5 hover:border-gold/30 hover:bg-felt-700/70 hover:shadow-[0_16px_40px_-20px_oklch(0.84_0.15_88/0.5)]">
                                <div className="flex items-center gap-3">
                                    <span
                                        className={cn(
                                            'grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br text-sm font-black text-felt-900 shadow-lg ring-2 ring-white/10',
                                            meta.coin
                                        )}>
                                        {meta.symbol}
                                    </span>

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-bold tracking-wide">{wallet.currency}</p>
                                        <p className="truncate text-[11px] text-white/40">{meta.label}</p>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-base font-black tabular-nums">{formatAmount(wallet.balance)}</p>
                                        {locked > 0 && (
                                            <p className="text-[10px] text-white/35 tabular-nums">
                                                {formatAmount(locked)} locked
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <Link
                                    to={`/wallets/${wallet.id}/deposit`}
                                    className="mt-3 block rounded-xl bg-gold/10 py-1.5 text-center text-[11px] font-bold tracking-[0.16em] text-gold uppercase transition-colors hover:bg-gold/20">
                                    Deposit
                                </Link>
                            </article>
                        );
                    })}

                    {canAddWallet && (
                        <Link
                            to="/wallets/new"
                            className="rounded-2xl border border-dashed border-white/15 py-4 text-center text-xs font-semibold text-white/40 transition-colors hover:border-gold/40 hover:bg-gold/5 hover:text-gold">
                            + Add new wallet
                        </Link>
                    )}
                </div>
            )}
        </section>
    );
}
