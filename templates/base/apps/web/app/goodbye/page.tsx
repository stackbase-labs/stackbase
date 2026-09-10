import { generatePageMetadata, pageMetadata } from '@/config/metadata';
import { Button } from '@workspace/ui/components/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@workspace/ui/components/empty';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export const metadata = generatePageMetadata(
  pageMetadata.goodbye.title,
  pageMetadata.goodbye.description,
);

export default function GoodbyePage() {
  return (
    <div className="from-background to-muted/20 flex min-h-[calc(100vh-var(--header-height))] items-center justify-center bg-linear-to-b px-4">
      <Empty className="bg-card w-full max-w-md border">
        <EmptyHeader>
          <EmptyMedia variant="default">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-500" />
            </div>
          </EmptyMedia>
          <EmptyTitle className="text-2xl">Account Deleted Successfully</EmptyTitle>
          <EmptyDescription>
            Your account and all associated data have been permanently removed
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <p className="text-muted-foreground text-sm">
            We&apos;re sorry to see you go! Your account has been successfully deleted from our
            system.
          </p>
          <p className="text-muted-foreground text-sm">
            If you change your mind, you&apos;re always welcome to create a new account and join us
            again.
          </p>
          <Button asChild className="w-full">
            <Link href="/">Return to Home</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/sign-up">Create New Account</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}
