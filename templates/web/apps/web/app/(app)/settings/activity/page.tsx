import { ActivityView } from '@/components/settings/activity-view';
import { generatePageMetadata, pageMetadata } from '@/config/metadata';
import { requireUser } from '@/lib/auth-helpers';
import { auth } from '@workspace/auth/server';
import { headers } from 'next/headers';
import type { ReactElement } from 'react';

export const metadata = generatePageMetadata(
  pageMetadata.settings.activity.title,
  pageMetadata.settings.activity.description,
  { noindex: true },
);

export default async function ActivityPage(): Promise<ReactElement> {
  const { session } = await requireUser();

  const sessions = await auth.api.listSessions({ headers: await headers() });

  return <ActivityView sessions={sessions} currentSessionId={session.id} />;
}
