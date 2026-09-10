import { useMutation } from '@tanstack/react-query';
import { signUp } from '@workspace/auth/client';
import { SignUpFormValues } from '@workspace/contracts';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function useSignUp() {
  const router = useRouter();

  return useMutation({
    mutationFn: (values: SignUpFormValues) => signUp.email(values),
    onSuccess: (data) => {
      if (data?.error) {
        toast.error(data.error.message || 'Something went wrong');
        return;
      }
      toast.success('Account created! Please check your email to verify your account.');
      router.push('/sign-in');
    },
    onError: (error: Error) => toast.error(error?.message || 'Something went wrong'),
  });
}
