import { twoFactorClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import { keys } from './keys';

const authClientOptions = {
  baseURL: keys().NEXT_PUBLIC_BASE_URL,
  plugins: [
    twoFactorClient({
      twoFactorPage: '/two-factor',
      onTwoFactorRedirect({ twoFactorMethods }) {
        const methods = twoFactorMethods;

        // No methods available
        if (!methods?.length) {
          window.location.href = '/login';
          return;
        }

        // TOTP is the only method available
        if (methods.includes('totp')) {
          window.location.href = '/two-factor'; // Handle the 2FA verification redirect
          return;
        }
      },
    }),
  ],
};

type AuthClient = ReturnType<typeof createAuthClient<typeof authClientOptions>>;

export const authClient: AuthClient = createAuthClient(authClientOptions);

export const signUp: AuthClient['signUp'] = authClient.signUp;
export const updateUser: AuthClient['updateUser'] = authClient.updateUser;

export const {
  signIn,
  signOut,
  useSession,
  getSession,
  revokeSession,
  revokeOtherSessions,
  sendVerificationEmail,
  listAccounts,
  linkSocial,
  unlinkAccount,
  twoFactor,
  changePassword,
  changeEmail,
  deleteUser,
  requestPasswordReset,
  resetPassword,
  $Infer,
} = authClient;

// Export the inferred session type for use in client components
export type Session = typeof authClient.$Infer.Session;
