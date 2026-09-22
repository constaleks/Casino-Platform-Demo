import { Link } from 'react-router-dom';
import { UserLayout } from '@/components/layout/UserLayout';
import { TransactionHistory } from '@/features/user/wallet/components/TransactionHistory';

export function TransactionsPage() {
    return (
        <UserLayout>
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Transaction History</h1>
                    <Link to="/dashboard" className="text-sm font-medium text-primary hover:underline">
                        Back to dashboard
                    </Link>
                </div>

                <TransactionHistory />
            </div>
        </UserLayout>
    );
}
