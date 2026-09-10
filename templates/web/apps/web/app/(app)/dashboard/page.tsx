import { generatePageMetadata, pageMetadata } from '@/config/metadata';
import { requireUser } from '@/lib/auth-helpers';
import type { ReactElement } from 'react';

export const metadata = generatePageMetadata(
  pageMetadata.dashboard.title,
  pageMetadata.dashboard.description,
  { noindex: true },
);

export default async function DashboardPage(): Promise<ReactElement> {
  const { user } = await requireUser();

  return (
    <section className="max-w-2xl p-12">
      <h1 className="mb-4 text-2xl font-semibold">Dashboard</h1>
      <div className="rounded-md py-4">
        <p>
          <span>Welcome back, </span>
          <span className="font-bold">{user.name || user.email}</span>!
        </p>
      </div>
    </section>
  );
}
