import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import { ChipSpinner } from '@/components/user/Loading';
import { useAuthStore } from './features/user/auth/authStore';

function App() {
    const status = useAuthStore((s) => s.status);
    const fetchCurrentUser = useAuthStore((s) => s.fetchCurrentUser);

    useEffect(() => {
        if (status === 'idle') {
            fetchCurrentUser();
        }
    }, [status, fetchCurrentUser]);

    if (status === 'idle') {
        return (
            <div className="flex min-h-svh flex-col items-center justify-center gap-5 bg-felt-900 text-white">
                <ChipSpinner className="size-12 border-4" />
                <p className="text-gold-gradient text-lg font-black tracking-[0.08em] uppercase">Casino 🍀 Platform</p>
                <p className="text-[11px] font-semibold tracking-[0.22em] text-white/30 uppercase">Shuffling the deck</p>
            </div>
        );
    }

    return <RouterProvider router={router} />;
}

export default App;
