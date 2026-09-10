import { SecurityView } from '@/components/security/security-view';
import { generatePageMetadata, pageMetadata } from '@/config/metadata';
import { requireUser } from '@/lib/auth-helpers';
import type { ReactElement } from 'react';

export const metadata = generatePageMetadata(
  pageMetadata.settings.security.title,
  pageMetadata.settings.security.description,
  { noindex: true },
);

export default async function SecurityPage(): Promise<ReactElement> {
  const { user } = await requireUser();

  const twoFactorEnabled = (user as { twoFactorEnabled?: boolean }).twoFactorEnabled ?? false;

  return <SecurityView twoFactorEnabled={twoFactorEnabled} />;
}
