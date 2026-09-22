import { UserLayout } from '@/components/layout/UserLayout';
import { PageHeader } from '@/components/user/PageHeader';
import { CreateWalletForm } from '@/features/user/wallet/components/CreateWalletForm';

export function NewWalletPage() {
    return (
        <UserLayout>
            <div className="flex flex-col gap-6">
                <PageHeader
                    eyebrow="Wallets"
                    title="Add a Wallet"
                    description="Open a new balance to play with. One wallet per currency."
                />

                <div className="mx-auto w-full max-w-md">
                    <CreateWalletForm />
                </div>
            </div>
        </UserLayout>
    );
}
