import { useEffect, useState, type SubmitEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchWallets, depositToWallet } from '@/api/user/wallets';
import type { Wallet } from '@/types/model';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/features/user/auth/authStore';

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
        return <p className="text-muted-foreground">Loading...</p>;
    }

    if (!wallet) {
        return <p className="text-muted-foreground">Wallet not found.</p>;
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="rounded-lg border p-4">
                <p className="font-medium">{wallet.currency}</p>
                <p className="text-2xl font-bold">{parseFloat(wallet.balance).toFixed(2)}</p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex flex-col gap-2">
                <label htmlFor="amount" className="text-sm font-medium">
                    Amount
                </label>
                <Input
                    id="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />
            </div>

            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Depositing...' : 'Deposit'}
            </Button>
        </form>
    );
}
