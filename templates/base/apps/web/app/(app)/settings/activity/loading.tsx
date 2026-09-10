import { Skeleton } from '@workspace/ui/components/skeleton';

export default function ActivityLoading() {
  return (
    <section className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      {/* Header Section */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Sessions Card Skeleton */}
      <div className="bg-card space-y-6 rounded-lg border p-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="mt-2 h-4 w-72" />
        </div>

        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="bg-muted/50 space-y-3 rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex justify-end">
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
