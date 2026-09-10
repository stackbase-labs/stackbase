import { ProfileView } from '@/components/profile/profile-view';
import { generatePageMetadata, pageMetadata } from '@/config/metadata';
import { requireUser } from '@/lib/auth-helpers';
import type { ReactElement } from 'react';

export const metadata = generatePageMetadata(
  pageMetadata.profile.title,
  pageMetadata.profile.description,
  { noindex: true },
);

export default async function ProfilePage(): Promise<ReactElement> {
  const { user } = await requireUser();

  return <ProfileView user={user} />;
}
