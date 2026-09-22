import { Link } from 'react-router-dom';
import { UserLayout } from '@/components/layout/UserLayout';
import { DepositForm } from '@/features/user/wallet/components/DepositForm';

export function DepositPage() {
    return (
        <UserLayout>
            <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Deposit</h1>
                    <Link to="/dashboard" className="text-sm font-medium text-primary hover:underline">
                        Back to dashboard
                    </Link>
                </div>

                <DepositForm />
            </div>
        </UserLayout>
    );
}
