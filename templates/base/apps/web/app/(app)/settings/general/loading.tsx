import { Skeleton } from '@workspace/ui/components/skeleton';

export default function GeneralSettingsLoading() {
  return (
    <section className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      {/* Header Section */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Profile Form Card Skeleton */}
      <div className="bg-card space-y-6 rounded-lg border p-6">
        <div className="space-y-1">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
    </section>
  );
}
