import { Skeleton } from '@workspace/ui/components/skeleton';

export default function DashboardLoading() {
  return (
    <div className="max-w-2xl space-y-4 p-12">
      <Skeleton className="h-8 w-1/3 rounded"></Skeleton>
      <Skeleton className="h-10 w-full rounded-md"></Skeleton>
    </div>
  );
}
