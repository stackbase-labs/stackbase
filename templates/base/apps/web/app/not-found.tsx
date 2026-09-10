import { Logo } from '@/components/ui/logo';
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
import { ArrowLeftIcon, Home } from 'lucide-react';
import Link from 'next/link';

export const metadata = generatePageMetadata(
  pageMetadata.notFound.title,
  pageMetadata.notFound.description,
  { noindex: true },
);

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-var(--header-height))] w-full items-center justify-center px-4">
      <Empty className="max-w-2xl border-0 p-0 md:p-0">
        <EmptyHeader>
          <EmptyMedia variant="default">
            <Logo variant="notFound" />
          </EmptyMedia>
          <h1 className="text-foreground text-6xl font-bold md:text-8xl">404</h1>
          <EmptyTitle className="text-muted-foreground text-xl font-semibold md:text-2xl">
            Page Not Found
          </EmptyTitle>
          <EmptyDescription className="max-w-md text-center text-pretty">
            The page you&apos;re looking for doesn&apos;t exist. It might have been moved, deleted,
            or you entered the wrong URL.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="default" size="lg" className="rounded-xl">
              <Link href="/">
                <ArrowLeftIcon />
                Back to Home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-xl">
              <Link href="/dashboard">
                <Home />
                Go to Dashboard
              </Link>
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </div>
  );
}
