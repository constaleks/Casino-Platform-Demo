import { useEffect, useState, type SubmitEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWallets, createWallet } from '@/api/user/wallets';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/features/user/auth/authStore';

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
        return <p className="text-muted-foreground">Loading...</p>;
    }

    if (availableToAdd.length === 0) {
        return <p className="text-muted-foreground">You already have a wallet in every available currency.</p>;
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex flex-col gap-2">
                <label htmlFor="currency" className="text-sm font-medium">
                    Currency
                </label>
                <select
                    id="currency"
                    className="rounded-md border bg-background px-3 py-2 text-sm"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as 'USD' | 'EUR')}>
                    {availableToAdd.map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </select>
            </div>

            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adding wallet...' : 'Add wallet'}
            </Button>
        </form>
    );
}
