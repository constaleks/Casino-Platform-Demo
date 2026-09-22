import { useEffect, useState, type SubmitEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from 'cn';
import { fetchWallets, createWallet } from '@/api/user/wallets';
import { useAuthStore } from '@/features/user/auth/authStore';
import { ChipSpinner, LoadingPanel } from '@/components/user/Loading';
import { CURRENCY_META } from '../currency';

const ADDABLE_CURRENCIES: Array<'USD' | 'EUR'> = ['USD', 'EUR'];

export function CreateWalletForm() {
    const navigate = useNavigate();
    const refreshAuthUser = useAuthStore((s) => s.fetchCurrentUser);

    const [availableToAdd, setAvailableToAdd] = useState<Array<'USD' | 'EUR'>>([]);
    const [currency, setCurrency] = useState<'USD' | 'EUR'>('USD');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchWallets()
            .then((wallets) => {
                const existing = new Set(wallets.map((w) => w.currency));
                const available = ADDABLE_CURRENCIES.filter((c) => !existing.has(c));
                setAvailableToAdd(available);
                if (available.length > 0) {
                    setCurrency(available[0]);
                }
            })
            .finally(() => setIsLoading(false));
    }, []);

    async function handleSubmit(e: SubmitEvent<HTMLFormElement>): Promise<void> {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            await createWallet(currency);
            await refreshAuthUser();
            navigate('/dashboard');
        } catch {
            setError('Could not add that wallet. You may already have one in this currency.');
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return <LoadingPanel label="Loading wallets" />;
    }

    if (availableToAdd.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-white/10 py-14 text-center">
                <p className="text-4xl">🪙</p>
                <p className="mt-3 font-bold">All set</p>
                <p className="mt-1 text-sm text-white/40">You already have a wallet in every available currency.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <fieldset className="flex flex-col gap-3">
                <legend className="mb-2 text-[11px] font-bold tracking-[0.22em] text-white/40 uppercase">
                    Choose a currency
                </legend>

                {availableToAdd.map((option) => {
                    const meta = CURRENCY_META[option];
                    const isSelected = currency === option;

                    return (
                        <label
                            key={option}
                            className={cn(
                                'flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5 transition-all',
                                isSelected
                                    ? 'border-gold/50 bg-gold/10 shadow-[0_16px_40px_-24px_oklch(0.84_0.15_88/0.8)]'
                                    : 'border-white/10 bg-felt-800/60 hover:border-white/20 hover:bg-felt-700/60'
                            )}>
                            <input
                                type="radio"
                                name="currency"
                                value={option}
                                checked={isSelected}
                                onChange={() => setCurrency(option)}
                                className="sr-only"
                            />

                            <span
                                className={cn(
                                    'grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br text-sm font-black text-felt-900 ring-2 ring-white/10',
                                    meta.coin
                                )}>
                                {meta.symbol}
                            </span>

                            <span className="flex-1">
                                <span className="block text-sm font-bold tracking-wide">{option}</span>
                                <span className="block text-[11px] text-white/40">{meta.label}</span>
                            </span>

                            <span
                                className={cn(
                                    'grid size-5 place-items-center rounded-full border text-[10px]',
                                    isSelected ? 'border-gold bg-gold text-felt-900' : 'border-white/20'
                                )}>
                                {isSelected ? '✓' : ''}
                            </span>
                        </label>
                    );
                })}
            </fieldset>

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
                {isSubmitting ? 'Adding wallet' : 'Add wallet'}
            </button>
        </form>
    );
}
