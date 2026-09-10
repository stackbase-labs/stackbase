import { useMutation } from '@tanstack/react-query';
import { sendVerificationEmail } from '@workspace/auth/client';
import { toast } from 'sonner';

export interface VerificationValues {
  email: string;
  callbackURL?: string;
}

export function useVerification() {
  return useMutation({
    mutationFn: (values: VerificationValues) => sendVerificationEmail(values),
    onSuccess: () => {
      toast.success('Verification email sent. Please check your inbox.');
    },
    onError: () => {
      toast.error('Failed to resend verification email. Please try again later.');
    },
  });
}
