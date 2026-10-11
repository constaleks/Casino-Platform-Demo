import type { ReactNode } from 'react';

import NavigationBar from '../user/NavigationBar';
import { LayoutBackdrop } from './LayoutBackdrop';

// Full-bleed shell for game tables. Unlike UserLayout there is no centered
// max-width card: the table uses the whole viewport. On screens big enough
// (the `game-fit` variant in index.css) the shell is locked to one screen
// height and the page itself never scrolls - children are expected to be a
// flex column that shrinks its panels (min-h-0 + overflow-auto) instead.
// Smaller screens fall back to normal page scrolling.
export function GameLayout({ children }: { children: ReactNode }) {
    return (
        <div className="relative min-h-svh bg-felt-900 text-white game-fit:h-svh game-fit:overflow-hidden">
            <LayoutBackdrop />

            <NavigationBar />

            {/* pt clears the fixed NavigationBar */}
            <main className="relative flex min-h-svh flex-col px-3 pt-[4.5rem] pb-3 sm:px-5 game-fit:h-svh game-fit:min-h-0">
                {children}
            </main>
        </div>
    );
}
