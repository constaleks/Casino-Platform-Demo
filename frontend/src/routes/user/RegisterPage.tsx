import { AuthLayout } from '@/components/layout/AuthLayout';
import { RegisterForm } from '@/features/user/auth/components/RegisterForm';

export function RegisterPage() {
    return (
        <AuthLayout>
            <div className="flex items-center justify-center p-6">
                <RegisterForm />
            </div>
        </AuthLayout>
    );
}
