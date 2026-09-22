import { UserLayout } from '@/components/layout/UserLayout';
import { PageHeader } from '@/components/user/PageHeader';
import { TransactionHistory } from '@/features/user/wallet/components/TransactionHistory';

export function TransactionsPage() {
    return (
        <UserLayout>
            <div className="flex flex-col gap-6">
                <PageHeader
                    eyebrow="Your money"
                    title="Transaction History"
                    description="Every deposit, bet, win, refund and bonus across all of your wallets."
                />

                <TransactionHistory />
            </div>
        </UserLayout>
    );
}
