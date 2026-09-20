import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { GuestRoute } from '@/features/auth/components/GuestRoute';
import { LoginPage } from '@/routes/user/LoginPage';
import { RegisterPage } from '@/routes/user/RegisterPage';
import { DashboardPage } from '@/routes/user/DashboardPage';

export const router = createBrowserRouter([
    { path: '/', element: <Navigate to="/dashboard" replace /> },
    {
        element: <GuestRoute />,
        children: [
            { path: '/login', element: <LoginPage /> },
            { path: '/register', element: <RegisterPage /> },
        ],
    },
    {
        element: <ProtectedRoute />,
        children: [{ path: '/dashboard', element: <DashboardPage /> }],
    },
]);
