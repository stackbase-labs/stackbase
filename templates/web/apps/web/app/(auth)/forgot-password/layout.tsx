import { generatePageMetadata, pageMetadata } from '@/config/metadata';

export const metadata = generatePageMetadata(
  pageMetadata.auth.forgotPassword.title,
  pageMetadata.auth.forgotPassword.description,
  { noindex: true },
);

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
