'use client';

import { ConfirmField, PasswordField } from '@/components/form';
import { useHasPassword } from '@/hooks/use-has-password';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { deleteUser } from '@workspace/auth/client';
import { DeleteAccountFormValues, deleteAccountSchema } from '@workspace/contracts';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { Form } from '@workspace/ui/components/form';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Spinner } from '@workspace/ui/components/spinner';
import { AlertCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

export function DeleteAccountForm() {
  const [showDialog, setShowDialog] = useState(false);
  const router = useRouter();
  const { data: hasPassword, isLoading: checkingPassword } = useHasPassword();

  const form = useForm<DeleteAccountFormValues>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      password: '',
      confirmation: '',
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (values: DeleteAccountFormValues) => {
      const result = await deleteUser({
        password: values.password,
        callbackURL: '/goodbye',
      });

      if (result.error) {
        throw new Error(result.error.message || 'Failed to delete account');
      }

      return result.data;
    },
    onSuccess: () => {
      toast.success('Account deleted successfully');
      setShowDialog(false);
      form.reset();

      // Redirect to goodbye page
      router.push('/goodbye');
    },
    onError: (error: Error) => {
      console.error('Error deleting account:', error);
      toast.error(error.message || 'Failed to delete account');
    },
  });

  const handleDeleteAccount = (values: DeleteAccountFormValues) => {
    deleteAccountMutation.mutate(values);
  };

  const handleOpenDialog = () => {
    if (checkingPassword) return;

    if (hasPassword === false) {
      toast.error('Please set a password first to delete your account', {
        description: 'OAuth users need to set a password before they can delete their account.',
      });
      return;
    }

    setShowDialog(true);
  };

  const confirmation = useWatch({
    control: form.control,
    name: 'confirmation',
    defaultValue: '',
  });
  const isDeleteDisabled = deleteAccountMutation.isPending || confirmation !== 'DELETE';

  return (
    <>
      <Card id="delete-account" className="border-destructive scroll-mt-6">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Delete Account
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Show warning if user doesn't have a password */}
          {!checkingPassword && hasPassword === false && (
            <Alert variant="default">
              <AlertCircle />
              <AlertTitle>Password Required</AlertTitle>
              <AlertDescription>
                You signed in with Google OAuth and don&apos;t have a password set. Please set a
                password first to delete your account.
                <Button asChild variant="link" className="h-auto p-0">
                  <Link href="#set-password">Set Password</Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              This action is permanent and irreversible. All your data, including your profile,
              settings, and any associated content will be permanently deleted.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button
            variant="destructive"
            onClick={handleOpenDialog}
            disabled={checkingPassword || hasPassword === false}
          >
            {checkingPassword ? <Spinner /> : <Trash2 className="mr-2 h-4 w-4" />}
            {checkingPassword ? 'Checking...' : 'Delete Account'}
          </Button>
        </CardFooter>
      </Card>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Please confirm you want to permanently delete your
              account.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleDeleteAccount)} className="space-y-4">
              <PasswordField
                control={form.control}
                name="password"
                label="Password"
                placeholder="Enter your password"
                description="Enter your password to confirm it's you."
                autoComplete="current-password"
              />

              <ConfirmField
                control={form.control}
                name="confirmation"
                label='Type "DELETE" to confirm'
                placeholder="DELETE"
                confirmText="DELETE"
                description="Type DELETE in capital letters to confirm."
              />

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  disabled={deleteAccountMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="destructive" disabled={isDeleteDisabled}>
                  {deleteAccountMutation.isPending ? (
                    <Spinner />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Account'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function DeleteAccountFormSkeleton() {
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="flex-1 space-y-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-80" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-32" />
      </CardContent>
    </Card>
  );
}
