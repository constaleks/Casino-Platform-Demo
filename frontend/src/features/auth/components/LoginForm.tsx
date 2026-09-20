import { useEffect, useState, type ChangeEvent, type SubmitEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Checkbox } from '@/components/ui/checkbox';

export function LoginForm() {
    const navigate = useNavigate();
    const login = useAuthStore((s) => s.login);
    const error = useAuthStore((s) => s.error);
    const isSubmitting = useAuthStore((s) => s.isSubmitting);
    const clearError = useAuthStore((s) => s.clearError);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);

    useEffect(() => {
        clearError();
    }, [clearError]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
        if (e.target.id === 'email') {
            setEmail(e.target.value);
        } else if (e.target.id === 'password') {
            setPassword(e.target.value);
        }
    };

    const handleRememberChange = (checked: boolean): void => {
        setRemember(checked);
    };

    const handleSubmit = async (e: SubmitEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        try {
            await login({ email, password, remember });
            navigate('/dashboard');
        } catch (err) {
            console.warn(err);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-6">
            <FieldGroup>
                <div className="flex flex-col items-center gap-1 text-center">
                    <h1 className="text-2xl font-bold">Sign in</h1>
                    <p className="text-sm text-balance text-muted-foreground">Enter your email and password to continue</p>
                </div>

                {error && <p className="text-sm text-destructive text-center">{error}</p>}

                <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input id="email" type="email" placeholder="m@example.com" value={email} onChange={handleChange} required />
                </Field>

                <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input id="password" type="password" value={password} onChange={handleChange} required />
                </Field>

                <Field orientation="horizontal">
                    <Checkbox id="remember" name="remember" checked={remember} onCheckedChange={handleRememberChange} />
                    <FieldLabel htmlFor="remember">Remember me</FieldLabel>
                </Field>

                <Field>
                    <Button type="submit" className="cursor-pointer" disabled={isSubmitting}>
                        {isSubmitting ? 'Signing in...' : 'Sign In'}
                    </Button>
                </Field>

                <FieldDescription className="px-6 text-center">
                    Don't have an account? <Link to="/register">Sign up</Link>
                </FieldDescription>
            </FieldGroup>
        </form>
    );
}
