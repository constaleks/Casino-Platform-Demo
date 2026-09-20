import { AuthLayout } from '@/components/layout/AuthLayout';
import { LoginForm } from '@/features/auth/components/LoginForm';

export function LoginPage() {
    return (
        <AuthLayout>
            <div className="flex items-center justify-center p-6">
                <LoginForm />
            </div>
        </AuthLayout>
    );
}
