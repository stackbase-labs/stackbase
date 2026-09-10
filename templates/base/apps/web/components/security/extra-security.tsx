'use client';

import { useMutation } from '@tanstack/react-query';
import { revokeOtherSessions } from '@workspace/auth/client';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Spinner } from '@workspace/ui/components/spinner';
import { AlertTriangle, LogOut, Shield } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function ExtraSecurity() {
  const [showDialog, setShowDialog] = useState(false);

  const revokeAllMutation = useMutation({
    mutationFn: async () => revokeOtherSessions(),
    onSuccess: () => {
      toast.success('Logged out from all other devices');
      setShowDialog(false);
    },
    onError: (error: Error) => {
      console.error('Error revoking sessions:', error);
      toast.error(error.message || 'Failed to revoke sessions');
    },
  });

  const handleRevokeAll = () => {
    revokeAllMutation.mutate();
  };

  return (
    <>
      <Card id="extra-security" className="scroll-mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Extra Security
          </CardTitle>
          <CardDescription>
            Enhanced security measures to protect your account from unauthorized access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/20 [&>svg]:text-orange-600 dark:[&>svg]:text-orange-400">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="text-foreground">Account Compromise?</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>
                If you suspect someone else has accessed your account, you can immediately log out
                of all devices except this one. This will require re-authentication on all other
                devices.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDialog(true)}
                disabled={revokeAllMutation.isPending}
                className="border-orange-300 bg-white hover:bg-orange-50 dark:border-orange-800 dark:bg-orange-950/50 dark:hover:bg-orange-900/50"
              >
                {revokeAllMutation.isPending ? (
                  <Spinner className="mr-2" />
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}
                {revokeAllMutation.isPending ? 'Logging out...' : 'Log Out All Other Devices'}
              </Button>
            </AlertDescription>
          </Alert>

          <Alert className="border-border">
            <Shield className="h-5 w-5" />
            <AlertTitle className="text-foreground">Security Tips</AlertTitle>
            <AlertDescription>
              <ul className="list-disc space-y-1 pl-4 text-sm">
                <li>Enable two-factor authentication for extra protection</li>
                <li>Use a strong, unique password for your account</li>
                <li>Regularly review your active sessions in the Activity page</li>
                <li>Never share your password or 2FA codes with anyone</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Log Out All Other Devices?
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <span>
                This will immediately end all active sessions on other devices and browsers. You
                will remain logged in on this device.
              </span>
              <span className="font-semibold text-orange-600 dark:text-orange-400">
                This action cannot be undone. All other devices will need to log in again.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={revokeAllMutation.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handleRevokeAll}
              disabled={revokeAllMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800"
            >
              {revokeAllMutation.isPending && <Spinner className="mr-2" />}
              {revokeAllMutation.isPending ? 'Logging out...' : 'Yes, Log Out All Other Devices'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ExtraSecuritySkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-5 w-32" />
        </div>
        <CardDescription>
          <Skeleton className="h-4 w-64" />
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border p-4">
          <div className="flex gap-3">
            <Skeleton className="h-5 w-5" />
            <div className="w-full space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-9 w-56" />
            </div>
          </div>
        </div>
        <div className="space-y-2 rounded-lg border p-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </CardContent>
    </Card>
  );
}
