'use client';

import { TwoFactorSetup } from '@/components/auth/two-factor-setup';
import { ConnectedAccounts } from '@/components/security/connected-accounts';
import { DeleteAccountForm } from '@/components/security/delete-account-form';
import { ExtraSecurity } from '@/components/security/extra-security';
import { PasswordForm } from '@/components/security/password-form';
import { useQueryClient } from '@tanstack/react-query';

interface SecurityViewProps {
  twoFactorEnabled: boolean;
}

export function SecurityView({ twoFactorEnabled }: SecurityViewProps) {
  const queryClient = useQueryClient();

  return (
    <section className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Security Settings</h1>
        <p className="text-muted-foreground">
          Manage your account security settings and two-factor authentication.
        </p>
      </div>

      {/* Password management - shows Set Password or Change Password based on user's current state */}
      <PasswordForm
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['has-password'] })}
      />

      <ConnectedAccounts />

      <TwoFactorSetup isEnabled={twoFactorEnabled} showStatus={true} />

      <ExtraSecurity />

      {/* Danger Zone - Delete Account */}
      <DeleteAccountForm />
    </section>
  );
}
