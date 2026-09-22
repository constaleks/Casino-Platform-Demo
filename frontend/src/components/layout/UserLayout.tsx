import type { ReactNode } from 'react';
import userBg from '@/assets/images/user-background.png';

import NavigationBar from '../user/NavigationBar';

// Fixed size on purpose: every page under this layout shares one card size
// so switching between them (dashboard, transactions, add wallet, ...)
// doesn't jump. A page that needs a narrower area (e.g. a single form)
// should center a narrower wrapper inside its own children instead of
// resizing this container.
export function UserLayout({ children }: { children: ReactNode }) {
    return (
        <div className="h-svh bg-cover bg-center" style={{ backgroundImage: `url(${userBg})` }}>
            <NavigationBar />
            <div className="flex justify-center pt-20 pb-10 h-full">
                <div className="w-full h-full max-w-6xl rounded-lg bg-background/50 p-6 backdrop-blur-sm">{children}</div>
            </div>
        </div>
    );
}
