import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import { useAuthStore } from './features/auth/authStore';

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
            <div className="flex min-h-svh items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    return <RouterProvider router={router} />;
}

export default App;
