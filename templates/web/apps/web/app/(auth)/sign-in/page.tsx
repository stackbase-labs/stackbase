import { AuthForm } from '@/components/auth/auth-form';
import { generatePageMetadata, pageMetadata } from '@/config/metadata';
import { Suspense } from 'react';

export const metadata = generatePageMetadata(
  pageMetadata.auth.signIn.title,
  pageMetadata.auth.signIn.description,
  { noindex: true },
);

export default function SignInPage() {
  return (
    <Suspense>
      <AuthForm mode="sign-in" />
    </Suspense>
  );
}
