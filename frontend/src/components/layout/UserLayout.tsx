import type { ReactNode } from 'react';
import userBg from '@/assets/images/user-background.png';

import NavigationBar from '../user/NavigationBar';

// Fixed size on purpose: every page under this layout shares one shell size
// so switching between them (dashboard, transactions, add wallet, ...)
// doesn't jump. A page that needs a narrower area (e.g. a single form)
// should center a narrower wrapper inside its own children instead of
// resizing this container.
export function UserLayout({ children }: { children: ReactNode }) {
    return (
        <div className="relative min-h-svh bg-felt-900 text-white">
            {/* Background stack: felt photo, darkening wash, and a warm spotlight. */}
            <div className="fixed inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${userBg})` }} />
            <div className="fixed inset-0 bg-gradient-to-b from-felt-900/75 via-felt-900/80 to-felt-900/95" />
            <div
                className="fixed inset-0 animate-pulse-glow"
                style={{
                    background:
                        'radial-gradient(60% 45% at 50% 0%, oklch(0.84 0.15 88 / 0.16), transparent 70%), radial-gradient(45% 40% at 85% 90%, oklch(0.64 0.19 305 / 0.14), transparent 70%)',
                }}
            />

            <NavigationBar />

            <div className="relative flex justify-center px-3 pt-24 pb-10 sm:px-6">
                <div className="min-h-[calc(100svh-8.5rem)] w-full max-w-6xl rounded-3xl border border-white/5 bg-felt-900/70 p-4 shadow-[0_30px_80px_-20px_oklch(0_0_0/0.8)] ring-1 ring-gold/10 backdrop-blur-xl sm:p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
