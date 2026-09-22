import { UserLayout } from '@/components/layout/UserLayout';
import { PageHeader } from '@/components/user/PageHeader';
import { DepositForm } from '@/features/user/wallet/components/DepositForm';

export function DepositPage() {
    return (
        <UserLayout>
            <div className="flex flex-col gap-6">
                <PageHeader
                    eyebrow="Wallets"
                    title="Deposit"
                    description="Top up this wallet to keep the chips moving. Funds land instantly."
                />

                <div className="mx-auto w-full max-w-md">
                    <DepositForm />
                </div>
            </div>
        </UserLayout>
    );
}
