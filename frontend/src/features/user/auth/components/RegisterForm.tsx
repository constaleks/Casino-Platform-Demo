import { useEffect, useState, type ChangeEvent, type SubmitEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/features/user/auth/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldContent } from '@/components/ui/field';
import { Checkbox } from '@/components/ui/checkbox';

export function RegisterForm() {
    const navigate = useNavigate();
    const register = useAuthStore((s) => s.register);
    const storeError = useAuthStore((s) => s.error);
    const isSubmitting = useAuthStore((s) => s.isSubmitting);
    const clearError = useAuthStore((s) => s.clearError);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    useEffect(() => {
        clearError();
    }, [clearError]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
        if (e.target.id === 'name') {
            setName(e.target.value);
        } else if (e.target.id === 'email') {
            setEmail(e.target.value);
        } else if (e.target.id === 'password') {
            setPassword(e.target.value);
        } else if (e.target.id === 'confirm-password') {
            setPasswordConfirmation(e.target.value);
        }
    };

    const handleTermsChange = (checked: boolean): void => {
        setAcceptedTerms(checked);
    };

    const handleSubmit = async (e: SubmitEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setLocalError(null);

        const FULL_NAME_PATTERN = /^\p{L}+(?:['-]\p{L}+)*(?:\s+\p{L}+(?:['-]\p{L}+)*)+$/u;
        if (!FULL_NAME_PATTERN.test(name.trim())) {
            setLocalError('Please enter your full name (first and last name).');
            return;
        }

        const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!PASSWORD_PATTERN.test(password)) {
            setLocalError('Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.');
            return;
        }

        if (password !== passwordConfirmation) {
            setLocalError('Passwords do not match.');
            return;
        }

        if (!acceptedTerms) {
            setLocalError('Please accept our terms and conditions.');
            return;
        }

        try {
            await register({
                name,
                email,
                password,
                password_confirmation: passwordConfirmation,
            });
            navigate('/dashboard');
        } catch (err) {
            console.warn(err);
        }
    };

    const errorMessage = localError ?? storeError;

    return (
        <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-6">
            <FieldGroup>
                <div className="flex flex-col items-center gap-1 text-center">
                    <h1 className="text-2xl font-bold">Create your account</h1>
                    <p className="text-sm text-balance text-muted-foreground">Fill in the form below to create your account</p>
                </div>

                {errorMessage && <p className="text-sm text-destructive text-center">{errorMessage}</p>}

                <Field>
                    <FieldLabel htmlFor="name">Full Name</FieldLabel>
                    <Input id="name" type="text" placeholder="John Doe" value={name} onChange={handleChange} required />
                    <FieldDescription>Enter your first and last name.</FieldDescription>
                </Field>

                <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input id="email" type="email" placeholder="m@example.com" value={email} onChange={handleChange} required />
                </Field>

                <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input id="password" type="password" value={password} onChange={handleChange} required />
                    <FieldDescription>
                        Must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.
                    </FieldDescription>
                </Field>

                <Field>
                    <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
                    <Input id="confirm-password" type="password" value={passwordConfirmation} onChange={handleChange} required />
                </Field>

                <Field orientation="horizontal">
                    <Checkbox
                        id="terms-checkbox-desc"
                        name="terms-checkbox-desc"
                        onCheckedChange={handleTermsChange}
                        checked={acceptedTerms}
                    />
                    <FieldContent>
                        <FieldLabel htmlFor="terms-checkbox-desc">Accept terms and conditions</FieldLabel>
                        <FieldDescription>By clicking this checkbox, you agree to the terms and conditions.</FieldDescription>
                    </FieldContent>
                </Field>

                <Field>
                    <Button type="submit" className="cursor-pointer" disabled={isSubmitting}>
                        {isSubmitting ? 'Creating account...' : 'Create Account'}
                    </Button>
                </Field>

                <FieldDescription className="px-6 text-center">
                    Already have an account? <Link to="/login">Sign in</Link>
                </FieldDescription>
            </FieldGroup>
        </form>
    );
}
