import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/features/user/auth/components/ProtectedRoute';
import { GuestRoute } from '@/features/user/auth/components/GuestRoute';
import { LoginPage } from '@/routes/user/LoginPage';
import { RegisterPage } from '@/routes/user/RegisterPage';
import { DashboardPage } from '@/routes/user/DashboardPage';
import { TransactionsPage } from '@/routes/user/TransactionsPage';
import { NewWalletPage } from '@/routes/user/NewWalletPage';
import { DepositPage } from '@/routes/user/DepositPage';

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
        children: [
            { path: '/dashboard', element: <DashboardPage /> },
            { path: '/transactions', element: <TransactionsPage /> },
            { path: '/wallets/new', element: <NewWalletPage /> },
            { path: '/wallets/:walletId/deposit', element: <DepositPage /> },
        ],
    },
]);
