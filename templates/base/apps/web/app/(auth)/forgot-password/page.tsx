'use client';

import { EmailField } from '@/components/form/email';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { requestPasswordReset } from '@workspace/auth/client';
import { ForgotPasswordFormValues, forgotPasswordSchema } from '@workspace/contracts';
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
import { ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [emailSent, setEmailSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (values: ForgotPasswordFormValues) => {
      const result = await requestPasswordReset({
        email: values.email,
        redirectTo: '/reset-password',
      });

      if (result.error) {
        throw new Error(result.error.message || 'Failed to send reset email');
      }

      return result.data;
    },
    onSuccess: (_, variables) => {
      setSubmittedEmail(variables.email);
      setEmailSent(true);
      form.reset();
    },
    onError: (error: Error) => {
      console.error('Error sending password reset email:', error);
      toast.error(error.message || 'Failed to send password reset email');
    },
  });

  const handleSubmit = (values: ForgotPasswordFormValues) => {
    forgotPasswordMutation.mutate(values);
  };

  if (emailSent) {
    return (
      <div className="from-background to-muted/20 flex min-h-[calc(100vh-var(--header-height))] items-center justify-center bg-gradient-to-b px-4">
        <Empty className="bg-card w-full max-w-md border">
          <EmptyHeader>
            <EmptyMedia variant="default">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <Mail className="h-10 w-10 text-green-600 dark:text-green-500" />
              </div>
            </EmptyMedia>
            <EmptyTitle className="text-2xl">Check Your Email</EmptyTitle>
            <EmptyDescription>We&apos;ve sent you a password reset link</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <p className="text-muted-foreground text-sm">
              If an account exists for <strong>{submittedEmail}</strong>, you will receive a
              password reset link shortly.
            </p>
            <p className="text-muted-foreground text-sm">
              Please check your email and follow the instructions to reset your password. The link
              will expire in 1 hour.
            </p>
            <div className="w-full pt-4">
              <Button asChild variant="outline" className="w-full">
                <Link href="/sign-in">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign In
                </Link>
              </Button>
            </div>
            <div className="w-full">
              <Button
                variant="link"
                onClick={() => {
                  setEmailSent(false);
                  form.reset();
                }}
                className="text-sm"
              >
                Didn&apos;t receive the email? Try again
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
          <CardTitle className="text-2xl">Forgot Password?</CardTitle>
          <CardDescription>
            No worries! Enter your email address and we&apos;ll send you a link to reset your
            password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <EmailField
                control={form.control}
                name="email"
                label="Email Address"
                description="Enter the email address associated with your account"
              />

              <Button type="submit" className="w-full" disabled={forgotPasswordMutation.isPending}>
                {forgotPasswordMutation.isPending && <Spinner />}
                {forgotPasswordMutation.isPending ? 'Sending reset link...' : 'Send Reset Link'}
              </Button>

              <div className="text-center">
                <Button asChild variant="link" className="text-sm">
                  <Link href="/sign-in">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Sign In
                  </Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
