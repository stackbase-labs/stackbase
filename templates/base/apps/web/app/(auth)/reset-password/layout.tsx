import { generatePageMetadata, pageMetadata } from '@/config/metadata';

export const metadata = generatePageMetadata(
  pageMetadata.auth.resetPassword.title,
  pageMetadata.auth.resetPassword.description,
  { noindex: true },
);

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
