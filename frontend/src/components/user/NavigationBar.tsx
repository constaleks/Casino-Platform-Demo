import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { Button } from '../ui/button';
import { Link } from 'react-router-dom';

import { useAuthStore } from '@/features/user/auth/authStore';

const NAV_LINK_CLASS =
    'rounded-lg px-2.5 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-white/60 uppercase transition-colors hover:bg-white/5 hover:text-white cursor-pointer';

function initialsOf(name: string | undefined): string {
    return (name ?? '')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

export default function NavigationBar() {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);

    return (
        <NavigationMenu className="fixed top-0 z-40 w-full max-w-none items-center justify-between gap-4 border-b border-gold/15 bg-felt-900/85 px-4 py-2.5 backdrop-blur-xl sm:px-6">
            <NavigationMenuList className="justify-start gap-1">
                <NavigationMenuItem>
                    <NavigationMenuLink className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold tracking-[0.14em] text-gold uppercase transition-colors hover:bg-gold/10 cursor-pointer">
                        <span aria-hidden="true">👑</span> VIP Program
                    </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem className="hidden sm:block">
                    <NavigationMenuLink className={NAV_LINK_CLASS}>Promotions</NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem className="hidden sm:block">
                    <NavigationMenuLink className={NAV_LINK_CLASS}>Tournaments</NavigationMenuLink>
                </NavigationMenuItem>
            </NavigationMenuList>

            <Link
                to="/dashboard"
                className="group relative rounded-full border border-gold/25 bg-gradient-to-b from-felt-700/90 to-felt-900/90 px-5 py-1.5 shadow-[0_8px_30px_-10px_oklch(0.84_0.15_88/0.6)] transition-transform hover:scale-[1.02]">
                <span className="text-gold-gradient text-lg font-black tracking-[0.08em] whitespace-nowrap uppercase">
                    Casino <span className="not-italic">🍀</span> Platform
                </span>
            </Link>

            <NavigationMenuList className="justify-end gap-1">
                <NavigationMenuItem className="hidden sm:block">
                    <NavigationMenuLink className={NAV_LINK_CLASS} render={<Link to="/transactions">Transactions</Link>} />
                </NavigationMenuItem>

                <NavigationMenuItem>
                    <NavigationMenuTrigger className="h-auto gap-2 rounded-full border border-white/10 bg-white/5 py-1 pr-2 pl-1 hover:bg-white/10 data-popup-open:bg-white/10">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-gold to-gold-deep text-xs font-black text-felt-900">
                            {initialsOf(user?.name) || '🍀'}
                        </span>
                        <span className="hidden flex-col items-start leading-tight sm:flex">
                            <span className="max-w-[10rem] truncate text-xs font-semibold text-white">{user?.name}</span>
                            <span className="max-w-[10rem] truncate text-[10px] text-white/45">{user?.email}</span>
                        </span>
                    </NavigationMenuTrigger>

                    <NavigationMenuContent className="min-w-56">
                        <div className="flex flex-col gap-1 p-1">
                            <div className="border-b border-white/10 px-2 pt-1 pb-2 sm:hidden">
                                <p className="truncate text-xs font-semibold">{user?.name}</p>
                                <p className="truncate text-[10px] text-white/45">{user?.email}</p>
                            </div>

                            <NavigationMenuLink
                                className="rounded-lg text-sm"
                                render={<Link to="/transactions">Transaction history</Link>}
                            />
                            <NavigationMenuLink className="rounded-lg text-sm" render={<Link to="/wallets/new">Add wallet</Link>} />

                            <NavigationMenuLink
                                render={
                                    <Button
                                        variant="ghost"
                                        className="w-full cursor-pointer justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => logout()}>
                                        Log out
                                    </Button>
                                }
                            />
                        </div>
                    </NavigationMenuContent>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    );
}
