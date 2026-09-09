import { Logo } from '@/components/ui/logo';
import { config } from '@/config/site';
import { Button } from '@workspace/ui/components/button';
import Link from 'next/link';

export default function Page() {
  return (
    <main className="m-auto flex items-center justify-center px-4">
      <div className="bg-background/70 flex max-w-2xl flex-col items-center gap-5 rounded-xl p-8 text-center backdrop-blur">
        <Logo variant="home" />
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{config.name}</h1>
        <span className="bg-muted text-muted-foreground rounded px-2 py-1 text-xs font-medium">
          Fullstack • Monorepo • TypeScript • Next.js • shadcn/ui
        </span>
        <p className="text-muted-foreground max-w-md">
          A starter template for building fullstack applications with Next.js and Turborepo.
          Includes authentication, email integration, responsive UI, and a modern development setup.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="sm">
            <Link href="https://github.com/stackbase-labs/stackbase" target="_blank">
              View on GitHub
            </Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link
              href="https://github.com/stackbase-labs/stackbase?tab=readme-ov-file#readme"
              target="_blank"
            >
              Read Docs
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
