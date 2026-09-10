'use client';

import { Logo } from '@/components/ui/logo';
import { Button } from '@workspace/ui/components/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@workspace/ui/components/empty';
import { ArrowLeftIcon, HomeIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

type ErrorType = 'email-required' | 'email-not-verified' | 'unknown';

const errorMessages: Record<
  ErrorType,
  {
    code?: string;
    title: string;
    description: string;
    buttons?: {
      text: string;
      href: string;
      variant: 'link' | 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost';
      icon: React.ElementType;
    }[];
  }
> = {
  'email-required': {
    code: '403',
    title: 'Email Required',
    description:
      "We couldn't retrieve your email from the provider. Please use a different login method.",
    buttons: [
      {
        text: 'Back to Sign In',
        href: '/sign-in',
        variant: 'default',
        icon: ArrowLeftIcon,
      },
      {
        text: 'Go to Home',
        href: '/',
        variant: 'outline',
        icon: HomeIcon,
      },
    ],
  },
  'email-not-verified': {
    code: '403',
    title: 'Email Not Verified',
    description:
      'Please verify your email address before signing in. Check your inbox for a verification email.',
    buttons: [
      {
        text: 'Back to Sign In',
        href: '/sign-in',
        variant: 'default',
        icon: ArrowLeftIcon,
      },
      {
        text: 'Go to Home',
        href: '/',
        variant: 'outline',
        icon: HomeIcon,
      },
    ],
  },
  unknown: {
    code: '500',
    title: 'Something went wrong',
    description: 'An unexpected error occurred. Please try again later.',
    buttons: [
      {
        text: 'Go Back',
        href: 'go-back', // this is handled specially
        variant: 'default',
        icon: ArrowLeftIcon,
      },
      {
        text: 'Back to Home',
        href: '/',
        variant: 'outline',
        icon: ArrowLeftIcon,
      },
    ],
  },
};

function ErrorPageContent() {
  const searchParams = useSearchParams();
  const errorType = (searchParams.get('type') as ErrorType) || 'unknown';
  const router = useRouter();

  const { code, title, description, buttons } = errorMessages[errorType] || errorMessages.unknown;

  return (
    <div className="flex min-h-[calc(100vh-var(--header-height))] w-full items-center justify-center px-4">
      <Empty className="max-w-2xl">
        <EmptyHeader>
          <EmptyMedia variant="default">
            <Logo variant="error" />
          </EmptyMedia>
          {code && <h1 className="text-foreground text-6xl font-bold md:text-8xl">{code}</h1>}
          <EmptyTitle className="text-muted-foreground text-xl font-semibold md:text-2xl">
            {title}
          </EmptyTitle>
          <EmptyDescription className="max-w-md text-center text-pretty">
            {description}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex flex-col gap-3 sm:flex-row">
            {buttons?.map((button) => {
              const isGoBack = button.href === 'go-back';
              return isGoBack ? (
                <Button
                  key={button.text}
                  onClick={() => router.back()}
                  variant={button.variant}
                  size="lg"
                  className="cursor-pointer rounded-xl"
                  title={button.text}
                  aria-label={button.text}
                >
                  <button.icon />
                  <span>{button.text}</span>
                </Button>
              ) : (
                <Button
                  key={button.text}
                  asChild
                  variant={button.variant}
                  size="lg"
                  className="rounded-xl"
                  title={button.text}
                  aria-label={button.text}
                >
                  <Link href={button.href}>
                    <button.icon />
                    <span>{button.text}</span>
                  </Link>
                </Button>
              );
            })}
          </div>
        </EmptyContent>
      </Empty>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense>
      <ErrorPageContent />
    </Suspense>
  );
}
