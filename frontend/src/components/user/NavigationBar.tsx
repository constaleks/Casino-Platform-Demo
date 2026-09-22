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

export default function NavigationBar() {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);

    return (
        <NavigationMenu className="fixed top-0 z-40 w-full max-w-none items-center justify-between gap-4 border-b border-border bg-muted/95 px-4 py-3 backdrop-blur-sm sm:px-6">
            <NavigationMenuList className="justify-start">
                <NavigationMenuItem>
                    <NavigationMenuLink>Promotions</NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuLink>Tournaments</NavigationMenuLink>
                </NavigationMenuItem>
            </NavigationMenuList>

            <div className="text-xl font-bold tracking-wide whitespace-nowrap">Casino 🍀 Platform</div>

            <NavigationMenuList className="justify-end">
                <NavigationMenuItem>
                    <NavigationMenuLink render={<Link to="/transactions">Transactions</Link>}></NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuTrigger className="flex-col items-end">
                        <span>{user?.name}</span>
                        <span>{user?.email}</span>
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <NavigationMenuLink
                            render={
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                                    onClick={() => logout()}>
                                    Log out
                                </Button>
                            }
                        />
                    </NavigationMenuContent>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    );
}
