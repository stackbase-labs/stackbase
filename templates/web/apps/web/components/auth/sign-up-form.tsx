'use client';

import { EmailField, NameField, PasswordField } from '@/components/form';
import { useSignUp } from '@/hooks/auth/use-sign-up';
import { zodResolver } from '@hookform/resolvers/zod';
import { SignUpFormValues, signUpSchema } from '@workspace/contracts';
import { Button } from '@workspace/ui/components/button';
import { Form } from '@workspace/ui/components/form';
import { Spinner } from '@workspace/ui/components/spinner';
import Link from 'next/link';
import { useForm } from 'react-hook-form';

export function SignUpForm() {
  const { mutate, isPending } = useSignUp();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    mode: 'onTouched',
    defaultValues: { name: '', email: '', password: '' },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => mutate(values))} className="grid gap-6">
        <NameField
          control={form.control}
          name="name"
          label="Name"
          placeholder="e.g. Your Name"
          description="Enter your full name."
        />

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
          autoComplete="new-password"
          description="Choose a strong password with at least 8 characters."
        />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Spinner />}
          {isPending ? 'Creating account...' : 'Sign up'}
        </Button>

        <p className="text-center text-sm">
          Already have an account?{' '}
          <Link href="/sign-in" className="underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </form>
    </Form>
  );
}
