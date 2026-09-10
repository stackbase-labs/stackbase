'use client';

import { PasswordField } from '@/components/form';
import { useHasPassword } from '@/hooks/use-has-password';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { changePassword } from '@workspace/auth/client';
import {
  ChangePasswordFormValues,
  changePasswordSchema,
  SetPasswordFormValues,
  setPasswordSchema,
} from '@workspace/contracts';
import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Checkbox } from '@workspace/ui/components/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@workspace/ui/components/form';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Spinner } from '@workspace/ui/components/spinner';
import { Lock } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface PasswordFormProps {
  onSuccess?: () => void;
}

export function PasswordForm({ onSuccess }: PasswordFormProps) {
  const { data: hasPassword, isLoading: isCheckingPassword } = useHasPassword();
  const isChangeMode = hasPassword === true;

  const form = useForm<SetPasswordFormValues | ChangePasswordFormValues>({
    resolver: zodResolver(isChangeMode ? changePasswordSchema : setPasswordSchema),
    defaultValues: {
      currentPassword: '',
      password: '',
      confirmPassword: '',
      revokeAllOtherSessions: false,
    },
  });

  useEffect(() => {
    form.reset();
  }, [isChangeMode, form]);

  const setPasswordMutation = useMutation({
    mutationFn: async (values: SetPasswordFormValues) => {
      const body = { newPassword: values.password };
      const response = await fetch('/api/auth/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to set password');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success(`Password set successfully!`);
      form.reset();
      onSuccess?.();
    },
    onError: (error: Error) => {
      console.error(`Error setting password:`, error);
      toast.error(error.message || `Failed to set password`);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (values: ChangePasswordFormValues) => {
      const result = await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.password,
        revokeOtherSessions: values.revokeAllOtherSessions || false,
      });
      return result;
    },
    onSuccess: () => {
      toast.success('Password changed successfully!');
      form.reset();
      onSuccess?.();
    },
    onError: (error: Error) => {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Failed to change password');
    },
  });

  function onSubmit(values: SetPasswordFormValues | ChangePasswordFormValues) {
    if (isChangeMode) {
      changePasswordMutation.mutate(values as ChangePasswordFormValues);
    } else {
      setPasswordMutation.mutate(values);
    }
  }

  const isSubmitting = setPasswordMutation.isPending || changePasswordMutation.isPending;

  if (isCheckingPassword) {
    return <PasswordFormSkeleton />;
  }

  return (
    <Card id={isChangeMode ? 'change-password' : 'set-password'} className="scroll-mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          {isChangeMode ? 'Change Password' : 'Set Account Password'}
        </CardTitle>
        <CardDescription>
          {isChangeMode
            ? 'Update your account password. Make sure to choose a strong password.'
            : 'Set a password for your account to enable additional security features like two-factor authentication.'}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {isChangeMode && (
              <PasswordField
                control={form.control}
                name="currentPassword"
                label="Current Password"
                placeholder="Enter current password"
                description="Enter your current password to confirm it's you."
                autoComplete="current-password"
              />
            )}

            <PasswordField
              control={form.control}
              name="password"
              label={isChangeMode ? 'New Password' : 'Password'}
              placeholder="Minimum 8 characters"
              description=" Choose a strong password with at least 8 characters."
              autoComplete="new-password"
            />

            <PasswordField
              control={form.control}
              name="confirmPassword"
              label="Confirm Password"
              placeholder="Re-enter your password"
              description="Re-enter your password to confirm."
              autoComplete="new-password"
            />

            {isChangeMode && (
              <FormField
                control={form.control}
                name="revokeAllOtherSessions"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer">Revoke all other sessions</FormLabel>
                      <FormDescription>
                        Sign out all other devices and browsers after changing your password. You
                        will remain signed in on this device.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            )}
          </CardContent>
          <CardFooter className="mt-4">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Spinner />}
              {isSubmitting
                ? isChangeMode
                  ? 'Changing password...'
                  : 'Setting password...'
                : isChangeMode
                  ? 'Change Password'
                  : 'Set Password'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

export function PasswordFormSkeleton() {
  return (
    <div className="bg-card space-y-6 rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-1">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <Skeleton className="h-10 w-24" />
    </div>
  );
}
