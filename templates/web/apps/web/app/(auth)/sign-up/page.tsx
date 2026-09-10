import { AuthForm } from '@/components/auth/auth-form';
import { generatePageMetadata, pageMetadata } from '@/config/metadata';
import { Suspense } from 'react';

export const metadata = generatePageMetadata(
  pageMetadata.auth.signUp.title,
  pageMetadata.auth.signUp.description,
  { noindex: true },
);

export default function SignUpPage() {
  return (
    <Suspense>
      <AuthForm mode="sign-up" />
    </Suspense>
  );
}
