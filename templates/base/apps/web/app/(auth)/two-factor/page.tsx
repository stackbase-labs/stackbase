import { TwoFactorVerification } from '@/components/auth/two-factor-verification';
import { generatePageMetadata, pageMetadata } from '@/config/metadata';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Suspense } from 'react';

export const metadata = generatePageMetadata(
  pageMetadata.auth.twoFactor.title,
  pageMetadata.auth.twoFactor.description,
  { noindex: true },
);

export default function TwoFactorPage() {
  return (
    <Suspense fallback={<TwoFactorVerificationSkeleton />}>
      <TwoFactorVerification />
    </Suspense>
  );
}

function TwoFactorVerificationSkeleton() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl border shadow">
          <div className="space-y-1.5 p-6 text-center">
            <div className="bg-primary/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
              <Skeleton className="h-6 w-6 rounded" />
            </div>
            <Skeleton className="mx-auto h-6 w-3/4" />
            <Skeleton className="mx-auto mt-2 h-4 w-full" />
          </div>
          <div className="space-y-6 p-6 pt-0">
            <div className="space-y-3">
              <Skeleton className="mx-auto h-4 w-32" />
              <div className="flex justify-center gap-2">
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-12 w-10 rounded-md" />
                ))}
              </div>
              <Skeleton className="mx-auto h-3 w-48" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="mx-auto h-4 w-40" />
          </div>
        </div>
      </div>
    </div>
  );
}
