'use client';

import { useMutation } from '@tanstack/react-query';
import { twoFactor } from '@workspace/auth/client';
import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@workspace/ui/components/input-otp';
import { Label } from '@workspace/ui/components/label';
import { Spinner } from '@workspace/ui/components/spinner';
import { ShieldCheck } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export function TwoFactorVerification() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [code, setCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);

  const verifyMutation = useMutation({
    mutationFn: async ({ code, isBackup }: { code: string; isBackup: boolean }) => {
      if (isBackup) {
        const result = await twoFactor.verifyBackupCode({ code });
        if (result.error) {
          throw new Error(result.error.message || 'Invalid backup code');
        }
        return { type: 'backup' as const, data: result.data };
      }

      const result = await twoFactor.verifyTotp({ code });
      if (result.error) {
        throw new Error(result.error.message || 'Invalid verification code');
      }
      return { type: 'totp' as const, data: result.data };
    },
    onSuccess: (data) => {
      toast.success(
        data.type === 'backup' ? 'Backup code verified successfully!' : 'Verification successful!',
      );
      router.push(callbackUrl);
    },
    onError: (error: Error) => {
      console.error('Error verifying 2FA:', error);
      toast.error(error.message || 'Failed to verify code');
      setCode('');
    },
  });

  const handleVerify = () => {
    if (!code || (useBackupCode ? code.length !== 11 : code.length !== 6)) {
      toast.error(useBackupCode ? 'Please enter your backup code' : 'Please enter a 6-digit code');
      return;
    }

    verifyMutation.mutate({ code, isBackup: useBackupCode });
  };

  return (
    <div className="flex min-h-svh items-center justify-center p-6 md:p-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            <ShieldCheck className="text-primary h-6 w-6" />
          </div>
          <CardTitle className="text-xl">Two-Factor Authentication</CardTitle>
          <CardDescription>
            {useBackupCode
              ? 'Enter one of your backup codes'
              : 'Enter the code from your authenticator app'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="code" className="block text-center">
                {useBackupCode ? 'Backup Code' : 'Verification Code'}
              </Label>

              <div className="flex justify-center">
                {useBackupCode ? (
                  <InputOTP
                    maxLength={11}
                    value={code}
                    onChange={(value: string) => setCode(value)}
                    onComplete={handleVerify}
                    autoFocus
                    pattern="[a-zA-Z0-9-]*"
                  >
                    <InputOTPGroup>
                      {Array.from({ length: 5 }, (_, i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                    <InputOTPGroup>
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                    <InputOTPGroup>
                      {Array.from({ length: 5 }, (_, i) => (
                        <InputOTPSlot key={i + 6} index={i + 6} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                ) : (
                  <InputOTP
                    maxLength={6}
                    value={code}
                    onChange={(value: string) => setCode(value)}
                    onComplete={handleVerify}
                    autoFocus
                  >
                    <InputOTPGroup>
                      {Array.from({ length: 6 }, (_, i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                )}
              </div>

              <p className="text-muted-foreground text-center text-xs">
                {useBackupCode
                  ? 'Enter your 10-character backup code (e.g., aFA81-o2bDq)'
                  : 'Enter the 6-digit code from your authenticator app'}
              </p>
            </div>

            <Button
              onClick={handleVerify}
              disabled={
                verifyMutation.isPending ||
                !code ||
                (useBackupCode ? code.length !== 11 : code.length !== 6)
              }
              className="w-full"
            >
              {verifyMutation.isPending && <Spinner />}
              {verifyMutation.isPending ? 'Verifying...' : 'Verify'}
            </Button>

            <div className="text-center">
              <Button
                variant="link"
                type="button"
                onClick={() => {
                  setUseBackupCode(!useBackupCode);
                  setCode('');
                }}
                className="text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                {useBackupCode ? 'Use authenticator code' : 'Use backup code instead'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
