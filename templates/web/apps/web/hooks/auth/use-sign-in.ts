import { useMutation } from '@tanstack/react-query';
import { signIn } from '@workspace/auth/client';
import { SignInFormValues } from '@workspace/contracts';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useVerification } from './use-verification';

const DEFAULT_CALLBACK_URL = '/';

export function useSignIn(callbackUrl: string = DEFAULT_CALLBACK_URL) {
  const router = useRouter();
  const verificationMutation = useVerification();

  return useMutation({
    mutationFn: (values: SignInFormValues) => signIn.email({ ...values, callbackURL: callbackUrl }),
    onSuccess: (data, variables) => {
      if (data?.error) {
        if (data.error.status === 403 && data.error.code === 'EMAIL_NOT_VERIFIED') {
          toast.error('Please verify your email address before signing in.', {
            action: {
              label: verificationMutation.isPending ? 'Sending…' : 'Resend email',
              onClick: async () => {
                verificationMutation.mutate({ email: variables.email, callbackURL: callbackUrl });
              },
            },
          });
          return;
        }
        toast.error(data.error.message || 'Something went wrong');
        return;
      }

      const signInData = data.data;
      if ('twoFactorRedirect' in signInData && signInData.twoFactorRedirect === true) {
        toast.info('Two-factor authentication required');
        router.push(`/two-factor?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        return;
      }

      toast.success('Signed in successfully!');
    },
    onError: (error: Error) => toast.error(error?.message || 'Something went wrong'),
  });
}
