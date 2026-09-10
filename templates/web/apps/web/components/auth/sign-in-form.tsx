'use client';

import { EmailField, PasswordField } from '@/components/form';
import { useSignIn } from '@/hooks/auth/use-sign-in';
import { zodResolver } from '@hookform/resolvers/zod';
import { SignInFormValues, signInSchema } from '@workspace/contracts';
import { Button } from '@workspace/ui/components/button';
import { Form } from '@workspace/ui/components/form';
import { Spinner } from '@workspace/ui/components/spinner';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';

export function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/';
  const { mutate, isPending } = useSignIn(callbackUrl);

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => mutate(values))} className="grid gap-6">
        <EmailField
          control={form.control}
          name="email"
          label="Email"
          description="We'll never share your email with anyone else."
        />

        <PasswordField
          control={form.control}
          name="password"
          label="Password"
          placeholder="Minimum 8 characters"
          autoComplete="current-password"
          description={
            <span className="flex items-center justify-between">
              <span>Enter the password for your account.</span>
              <Link
                href="/forgot-password"
                className="text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                Forgot password?
              </Link>
            </span>
          }
        />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Spinner />}
          {isPending ? 'Signing in...' : 'Sign in'}
        </Button>

        <p className="text-center text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" className="underline underline-offset-4">
            Sign up
          </Link>
        </p>
      </form>
    </Form>
  );
}
