import { GeneralSettingsForm } from '@/components/settings/general-settings-form';
import { generatePageMetadata, pageMetadata } from '@/config/metadata';
import { requireUser } from '@/lib/auth-helpers';
import type { ReactElement } from 'react';

export const metadata = generatePageMetadata(
  pageMetadata.settings.general.title,
  pageMetadata.settings.general.description,
  { noindex: true },
);

export default async function GeneralSettingsPage(): Promise<ReactElement> {
  const { user } = await requireUser();

  return <GeneralSettingsForm user={user} />;
}
