import { useAuthStore } from '@/features/auth/authStore';
import { Button } from '@/components/ui/button';

export function DashboardPage() {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);

    const wallet = user?.wallets?.[0];

    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
            <div className="text-center">
                <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
                <p className="text-muted-foreground">{user?.email}</p>
            </div>

            <div className="rounded-lg border p-6 text-center">
                <p className="text-sm text-muted-foreground">Balance</p>
                <p className="text-3xl font-bold">
                    {wallet ? `${parseFloat(wallet.balance).toFixed(2)} ${wallet.currency}` : 'Loading...'}
                </p>
            </div>

            <Button variant="outline" onClick={() => logout()}>
                Log out
            </Button>
        </div>
    );
}
