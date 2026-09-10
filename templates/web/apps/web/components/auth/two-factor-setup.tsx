'use client';

import { useHasPassword } from '@/hooks/use-has-password';
import { useMutation } from '@tanstack/react-query';
import { twoFactor } from '@workspace/auth/client';
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
import { Input } from '@workspace/ui/components/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@workspace/ui/components/input-otp';
import { Label } from '@workspace/ui/components/label';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Spinner } from '@workspace/ui/components/spinner';
import { AlertCircle, Shield, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import QRCode from 'qrcode';
import { useState } from 'react';
import { toast } from 'sonner';

interface TwoFactorSetupProps {
  isEnabled: boolean;
  onStatusChange?: (enabled: boolean) => void;
  showStatus?: boolean;
}

export function TwoFactorSetup({
  isEnabled,
  onStatusChange,
  showStatus = false,
}: TwoFactorSetupProps) {
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [totpCode, setTotpCode] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'qr' | 'verify' | 'backup'>('qr');

  // Check if user has a password set
  const { data: hasPassword, isLoading: checkingPassword } = useHasPassword();

  const enableMutation = useMutation({
    mutationFn: async (password: string) => {
      const result = await twoFactor.enable({ password });
      if (result.error) {
        throw new Error(result.error.message || 'Failed to generate 2FA setup');
      }
      return result.data;
    },
    onSuccess: async (data) => {
      if (data) {
        // Generate QR code image from TOTP URI
        const qrCodeDataUrl = await QRCode.toDataURL(data.totpURI);
        setQrCode(qrCodeDataUrl);
        setBackupCodes(data.backupCodes || []);
        setStep('verify');
        setPassword('');
      }
    },
    onError: (error: Error) => {
      console.error('Error enabling 2FA:', error);
      toast.error(error.message || 'Failed to enable 2FA');
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (code: string) => {
      const result = await twoFactor.verifyTotp({ code });
      if (result.error) {
        throw new Error(result.error.message || 'Invalid verification code');
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success('Two-factor authentication enabled successfully!');
      setStep('backup');
    },
    onError: (error: Error) => {
      console.error('Error verifying 2FA:', error);
      toast.error(error.message || 'Failed to verify code');
      setTotpCode('');
    },
  });

  const disableMutation = useMutation({
    mutationFn: async (password: string) => {
      const result = await twoFactor.disable({ password });
      if (result.error) {
        throw new Error(result.error.message || 'Failed to disable 2FA');
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success('Two-factor authentication disabled');
      setShowDisableDialog(false);
      setPassword('');
      onStatusChange?.(false);
    },
    onError: (error: Error) => {
      console.error('Error disabling 2FA:', error);
      toast.error(error.message || 'Failed to disable 2FA');
    },
  });

  const handleEnable2FA = () => {
    enableMutation.mutate(password);
  };

  const handleVerify2FA = () => {
    if (totpCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }
    verifyMutation.mutate(totpCode);
  };

  const handleDisable2FA = () => {
    disableMutation.mutate(password);
  };

  const handleComplete = () => {
    setShowSetupDialog(false);
    setStep('qr');
    setQrCode('');
    setTotpCode('');
    setBackupCodes([]);
    onStatusChange?.(true);
  };

  const handleEnableClick = () => {
    if (checkingPassword) return;

    if (hasPassword === false) {
      toast.error('Please set a password first to enable 2FA', {
        description:
          'OAuth users need to set a password before enabling two-factor authentication.',
      });
      return;
    }

    setShowSetupDialog(true);
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    toast.success('Backup codes copied to clipboard');
  };

  const downloadBackupCodes = () => {
    const element = document.createElement('a');
    const file = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'backup-codes.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Backup codes downloaded');
  };

  return (
    <>
      <Card id="two-factor-authentication" className="scroll-mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isEnabled ? (
              <ShieldCheck className="h-5 w-5 text-green-600" />
            ) : (
              <Shield className="h-5 w-5" />
            )}
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account by enabling two-factor authentication.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showStatus && (
            <div className="text-sm">
              Status:{' '}
              <span className={isEnabled ? 'font-medium text-green-600' : 'text-muted-foreground'}>
                {isEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          )}

          {/* Show warning if user doesn't have a password */}
          {!checkingPassword && hasPassword === false && !isEnabled && (
            <Alert variant="default">
              <AlertCircle />
              <AlertTitle>Password Required</AlertTitle>
              <AlertDescription>
                You signed in with Google OAuth and don&apos;t have a password set. Please set a
                password first to enable two-factor authentication.
                <Button asChild variant="link" className="h-auto p-0">
                  <Link href="#set-password">Set Password</Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          {isEnabled ? (
            <Button variant="destructive" onClick={() => setShowDisableDialog(true)}>
              Disable 2FA
            </Button>
          ) : (
            <Button
              onClick={handleEnableClick}
              disabled={checkingPassword || hasPassword === false}
            >
              {checkingPassword && <Spinner />}
              {checkingPassword ? 'Checking...' : 'Enable 2FA'}
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Enable 2FA Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="px-2 py-6 sm:max-w-md sm:px-6">
          <DialogHeader className="items-center">
            <DialogTitle>
              {step === 'qr' && 'Enable Two-Factor Authentication'}
              {step === 'verify' && 'Verify Your Code'}
              {step === 'backup' && 'Save Your Backup Codes'}
            </DialogTitle>
            <DialogDescription>
              {step === 'qr' &&
                'Enter your password to generate a QR code for your authenticator app.'}
              {step === 'verify' &&
                'Enter the 6-digit code from your authenticator app to complete setup.'}
              {step === 'backup' &&
                'Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.'}
            </DialogDescription>
          </DialogHeader>

          {step === 'qr' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEnable2FA()}
                />
              </div>
              <DialogFooter>
                <Button
                  onClick={handleEnable2FA}
                  disabled={enableMutation.isPending || !password}
                  className="w-full"
                >
                  {enableMutation.isPending && <Spinner />}
                  {enableMutation.isPending ? 'Generating...' : 'Generate QR Code'}
                </Button>
              </DialogFooter>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-4">
              {qrCode && (
                <div className="flex flex-col items-center space-y-4">
                  <p className="text-muted-foreground text-center text-sm">
                    Scan this QR code with your authenticator app (Google Authenticator, Authy,
                    etc.)
                  </p>
                  <div className="flex items-center justify-center rounded-lg bg-white p-4">
                    <Image
                      src={qrCode}
                      alt="QR Code"
                      height={200}
                      width={200}
                      className="aspect-square h-auto w-auto"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-3">
                <Label htmlFor="code" className="block text-center">
                  Verification Code
                </Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={totpCode}
                    onChange={(value: string) => setTotpCode(value)}
                    onComplete={handleVerify2FA}
                    autoFocus
                  >
                    <InputOTPGroup>
                      {Array.from({ length: 6 }, (_, i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <p className="text-muted-foreground text-center text-xs">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleVerify2FA}
                  disabled={verifyMutation.isPending || totpCode.length !== 6}
                  className="w-full"
                >
                  {verifyMutation.isPending && <Spinner />}
                  {verifyMutation.isPending ? 'Verifying...' : 'Verify Code'}
                </Button>
              </DialogFooter>
            </div>
          )}

          {step === 'backup' && (
            <div className="space-y-4">
              <div className="bg-muted space-y-2 rounded-lg p-4">
                <p className="text-sm font-medium">Your Backup Codes:</p>
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="bg-background rounded p-2 text-center">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={copyBackupCodes} className="flex-1">
                  Copy Codes
                </Button>
                <Button variant="outline" onClick={downloadBackupCodes} className="flex-1">
                  Download Codes
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={handleComplete} className="w-full">
                  Complete Setup
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your password to disable two-factor authentication for your account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="disable-password">Password</Label>
              <Input
                id="disable-password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDisable2FA()}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDisableDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisable2FA}
                disabled={disableMutation.isPending || !password}
              >
                {disableMutation.isPending && <Spinner />}
                {disableMutation.isPending ? 'Disabling...' : 'Disable 2FA'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function TwoFactorSetupSkeleton() {
  return (
    <div className="bg-card space-y-6 rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-1">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      <Skeleton className="h-20 w-full" />
    </div>
  );
}
