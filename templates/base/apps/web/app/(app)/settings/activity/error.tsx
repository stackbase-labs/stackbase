'use client';

import { Button } from '@workspace/ui/components/button';
import { Card, CardContent } from '@workspace/ui/components/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@workspace/ui/components/empty';
import { AlertCircle } from 'lucide-react';
import { useEffect } from 'react';

export default function ActivityError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error loading activity:', error);
  }, [error]);

  return (
    <section className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Activity</h1>
        <p className="text-muted-foreground mt-2">
          Manage your active sessions and view account activity.
        </p>
      </div>
      <Card>
        <CardContent className="py-6">
          <Empty className="gap-3 border-0 p-0 md:p-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <AlertCircle className="text-destructive size-5" />
              </EmptyMedia>
              <EmptyTitle>Unable to load sessions</EmptyTitle>
              <EmptyDescription>Failed to load sessions. Please try again later.</EmptyDescription>
            </EmptyHeader>
          </Empty>
          <div className="mt-4 flex justify-center">
            <Button variant="outline" size="sm" onClick={() => reset()}>
              Try again
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
