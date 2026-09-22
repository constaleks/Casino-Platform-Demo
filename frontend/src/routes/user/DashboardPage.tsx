import { UserLayout } from '@/components/layout/UserLayout';
import { useAuthStore } from '@/features/user/auth/authStore';

import { GamesList } from '@/features/user/games/components/GamesList';
import { WalletsPanel } from '@/features/user/wallet/components/WalletsPanel';

export function DashboardPage() {
    const user = useAuthStore((s) => s.user);

    return (
        <UserLayout>
            <div className="my-auto w-full grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr_220px]">
                <aside className="order-2 lg:order-1">
                    <WalletsPanel />
                </aside>

                <main className="order-1 flex flex-col lg:order-2">
                    <h1 className="text-2xl font-bold text-center">Welcome, {user?.name}</h1>
                    <h4 className="text-center">{user?.email}</h4>
                </main>

                <aside className="order-3 text-center lg:text-right">
                    <GamesList />
                </aside>
            </div>
        </UserLayout>
    );
}
