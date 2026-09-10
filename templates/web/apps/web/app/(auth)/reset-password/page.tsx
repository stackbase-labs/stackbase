'use client';

import { PasswordField } from '@/components/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { resetPassword } from '@workspace/auth/client';
import { ResetPasswordFormValues, resetPasswordSchema } from '@workspace/contracts';
import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@workspace/ui/components/empty';
import { Form } from '@workspace/ui/components/form';
import { Spinner } from '@workspace/ui/components/spinner';
import { CheckCircle2, Lock } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const [resetSuccess, setResetSuccess] = useState(false);

  const token = searchParams.get('token');
  const error = searchParams.get('error');

  useEffect(() => {
    if (error) {
      if (error === 'invalid_token') {
        toast.error('Invalid or expired reset link', {
          description: 'Please request a new password reset link.',
        });
      }
    }
  }, [error]);

  const isTokenError = error || !token;

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (values: ResetPasswordFormValues) => {
      if (!token) {
        throw new Error('Reset token is missing');
      }

      const result = await resetPassword({
        newPassword: values.password,
        token,
      });

      if (result.error) {
        throw new Error(result.error.message || 'Failed to reset password');
      }

      return result.data;
    },
    onSuccess: () => {
      setResetSuccess(true);
      form.reset();
    },
    onError: (error: Error) => {
      console.error('Error resetting password:', error);
      toast.error(error.message || 'Failed to reset password');
    },
  });

  const handleSubmit = (values: ResetPasswordFormValues) => {
    resetPasswordMutation.mutate(values);
  };

  if (isTokenError || !token) {
    return (
      <div className="from-background to-muted/20 flex min-h-[calc(100vh-var(--header-height))] items-center justify-center bg-gradient-to-b px-4">
        <Empty className="bg-card w-full max-w-md border">
          <EmptyHeader>
            <EmptyMedia variant="default">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <Lock className="h-10 w-10 text-red-600 dark:text-red-500" />
              </div>
            </EmptyMedia>
            <EmptyTitle className="text-2xl">Invalid Reset Link</EmptyTitle>
            <EmptyDescription>This password reset link is invalid or has expired</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <p className="text-muted-foreground text-sm">
              Password reset links expire after 1 hour for security reasons.
            </p>
            <p className="text-muted-foreground text-sm">
              Please request a new password reset link to continue.
            </p>
            <div className="w-full pt-4">
              <Button asChild className="w-full">
                <Link href="/forgot-password">Request New Link</Link>
              </Button>
            </div>
            <div className="w-full">
              <Button asChild variant="outline" className="w-full">
                <Link href="/sign-in">Back to Sign In</Link>
              </Button>
            </div>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="from-background to-muted/20 flex min-h-[calc(100vh-var(--header-height))] items-center justify-center bg-gradient-to-b px-4">
        <Empty className="bg-card w-full max-w-md border">
          <EmptyHeader>
            <EmptyMedia variant="default">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-500" />
              </div>
            </EmptyMedia>
            <EmptyTitle className="text-2xl">Password Reset Successful</EmptyTitle>
            <EmptyDescription>Your password has been successfully updated</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <p className="text-muted-foreground text-sm">
              You can now sign in with your new password.
            </p>
            <div className="w-full pt-4">
              <Button asChild className="w-full">
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </div>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return (
    <div className="from-background to-muted/20 flex min-h-[calc(100vh-var(--header-height))] items-center justify-center bg-gradient-to-b px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Reset Your Password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <PasswordField
                control={form.control}
                name="password"
                label="New Password"
                placeholder="Minimum 8 characters"
                description="Password must be 8-100 characters long and contain a mix of letters and numbers"
                autoComplete="new-password"
              />

              <PasswordField
                control={form.control}
                name="confirmPassword"
                label="Confirm Password"
                placeholder="Re-enter your password"
                description="Re-enter your password to confirm"
                autoComplete="new-password"
              />

              <Button type="submit" className="w-full" disabled={resetPasswordMutation.isPending}>
                {resetPasswordMutation.isPending && <Spinner />}
                {resetPasswordMutation.isPending ? 'Resetting password...' : 'Reset Password'}
              </Button>

              <div className="text-center">
                <Button asChild variant="link" className="text-sm">
                  <Link href="/sign-in">Back to Sign In</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="from-background to-muted/20 flex min-h-[calc(100vh-var(--header-height))] items-center justify-center bg-gradient-to-b px-4">
          <Card className="w-full max-w-md">
            <CardContent className="flex items-center justify-center py-12">
              <Spinner />
            </CardContent>
          </Card>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
