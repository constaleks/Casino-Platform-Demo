import { UserLayout } from '@/components/layout/UserLayout';
import { useAuthStore } from '@/features/user/auth/authStore';

import { GamesList } from '@/features/user/games/components/GamesList';
import { WalletsPanel } from '@/features/user/wallet/components/WalletsPanel';
import { ActivityRail } from '@/features/user/dashboard/components/ActivityRail';

export function DashboardPage() {
    const user = useAuthStore((s) => s.user);
    const firstName = user?.name?.split(' ')[0] ?? 'player';

    return (
        <UserLayout>
            <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[260px_1fr_240px]">
                <aside className="order-2 lg:order-1">
                    <WalletsPanel />
                </aside>

                <main className="order-1 flex flex-col gap-6 lg:order-2">
                    <div className="relative overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-br from-felt-700 via-felt-800 to-felt-900 p-5 sm:p-6">
                        <span className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-gold/20 blur-3xl" />
                        <span className="pointer-events-none absolute -bottom-20 -left-10 size-40 rounded-full bg-chip-purple/20 blur-3xl" />

                        <p className="relative text-[11px] font-bold tracking-[0.22em] text-gold/80 uppercase">🍀 Welcome back</p>
                        <h1 className="text-gold-gradient relative mt-1.5 text-3xl font-black tracking-tight sm:text-4xl">{firstName}</h1>
                        <p className="relative mt-2 max-w-md text-sm text-white/50">
                            The table is set and the wheel is warm. Pick a game below, top up a wallet, or review where your chips have
                            been.
                        </p>

                        <div className="relative mt-4 flex flex-wrap gap-2">
                            <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-white/60 uppercase backdrop-blur-sm">
                                {user?.email}
                            </span>
                            <span className="rounded-full border border-win/25 bg-win/10 px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-win uppercase">
                                ● {user?.status ?? 'active'}
                            </span>
                        </div>
                    </div>

                    <GamesList />
                </main>

                <aside className="order-3">
                    <ActivityRail />
                </aside>
            </div>
        </UserLayout>
    );
}
