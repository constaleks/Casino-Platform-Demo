import { useEffect, useState, type SubmitEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from 'cn';
import { fetchWallets, depositToWallet } from '@/api/user/wallets';
import type { Wallet } from '@/types/model';
import { ChipSpinner, LoadingPanel } from '@/components/user/Loading';
import { useAuthStore } from '@/features/user/auth/authStore';
import { CURRENCY_META, formatAmount } from '../currency';

const QUICK_AMOUNTS = [10, 50, 100, 500];

export function DepositForm() {
    const { walletId } = useParams<{ walletId: string }>();
    const navigate = useNavigate();
    const refreshAuthUser = useAuthStore((s) => s.fetchCurrentUser);

    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchWallets()
            .then((wallets) => {
                setWallet(wallets.find((w) => String(w.id) === walletId) ?? null);
            })
            .finally(() => setIsLoading(false));
    }, [walletId]);

    async function handleSubmit(e: SubmitEvent<HTMLFormElement>): Promise<void> {
        e.preventDefault();
        setError(null);

        const parsedAmount = parseFloat(amount);
        if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
            setError('Enter a valid deposit amount.');
            return;
        }

        if (!wallet) {
            return;
        }

        setIsSubmitting(true);
        try {
            await depositToWallet(wallet.id, parsedAmount);
            await refreshAuthUser();
            navigate('/dashboard');
        } catch {
            setError('Deposit failed. Please try again.');
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return <LoadingPanel label="Loading wallet" />;
    }

    if (!wallet) {
        return (
            <div className="rounded-2xl border border-dashed border-white/10 py-14 text-center">
                <p className="text-4xl">🔍</p>
                <p className="mt-3 font-bold">Wallet not found</p>
                <p className="mt-1 text-sm text-white/40">This wallet doesn't exist or doesn't belong to you.</p>
            </div>
        );
    }

    const meta = CURRENCY_META[wallet.currency];
    const preview = parseFloat(amount);
    const hasPreview = !Number.isNaN(preview) && preview > 0;

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Wallet being topped up */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-felt-700 via-felt-800 to-felt-900 p-5">
                <span className="pointer-events-none absolute -top-10 -right-8 size-32 rounded-full bg-gold/15 blur-3xl" />

                <div className="relative flex items-center gap-3">
                    <span
                        className={cn(
                            'grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br text-base font-black text-felt-900 ring-2 ring-white/10',
                            meta.coin
                        )}>
                        {meta.symbol}
                    </span>
                    <div>
                        <p className="text-sm font-bold tracking-wide">{wallet.currency}</p>
                        <p className="text-[11px] text-white/40">{meta.label}</p>
                    </div>
                </div>

                <div className="relative mt-4">
                    <p className="text-[10px] font-bold tracking-[0.22em] text-white/35 uppercase">Current balance</p>
                    <p className="text-3xl font-black tabular-nums">{formatAmount(wallet.balance)}</p>

                    {hasPreview && (
                        <p className="mt-1 text-xs font-semibold text-win tabular-nums">
                            → {formatAmount(parseFloat(wallet.balance) + preview)} after deposit
                        </p>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <label htmlFor="amount" className="text-[11px] font-bold tracking-[0.22em] text-white/40 uppercase">
                    Amount
                </label>

                <div className="relative">
                    <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-lg font-black text-white/30">
                        {meta.symbol}
                    </span>
                    <input
                        id="amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-felt-800/70 py-3.5 pr-4 pl-10 text-xl font-black tabular-nums outline-none transition-colors placeholder:text-white/20 focus:border-gold/50 focus:ring-3 focus:ring-gold/15"
                    />
                </div>

                <div className="mt-1 flex flex-wrap gap-2">
                    {QUICK_AMOUNTS.map((quick) => (
                        <button
                            key={quick}
                            type="button"
                            onClick={() => setAmount(String(quick))}
                            className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-bold text-white/60 transition-colors hover:border-gold/40 hover:bg-gold/10 hover:text-gold">
                            +{quick}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <p className="rounded-xl border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                </p>
            )}

            <button
                type="submit"
                disabled={isSubmitting}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gold to-gold-deep py-3 text-sm font-black tracking-[0.16em] text-felt-900 uppercase transition-all not-disabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting && <ChipSpinner className="size-4 border-felt-900/70 border-t-transparent" />}
                {isSubmitting ? 'Depositing' : 'Deposit funds'}
            </button>
        </form>
    );
}
