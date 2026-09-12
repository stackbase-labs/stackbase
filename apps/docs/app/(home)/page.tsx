import {
  ArrowRight,
  BookOpen,
  Box,
  Code2,
  Component,
  Database,
  FileCode,
  FlaskConical,
  Gauge,
  GitBranch,
  Layers,
  Mail,
  Package,
  ScrollText,
  ShieldCheck,
  Ship,
  Terminal,
  Zap,
} from "lucide-react";
import { SiGithub } from "react-icons/si";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@/lib/cn";
import { CopyButton } from "./_components/copy-button";
import { GridBackground } from "./_components/grid-background";
import { Reveal } from "./_components/reveal";
import { AnimatedTerminal } from "./_components/animated-terminal";
import { TechLogos } from "./_components/tech-logos";
import { LifecycleSection } from "./_components/lifecycle-section";
import { TypeFlowSection } from "./_components/typeflow-section";
import { AnnouncementBanner } from "./_components/announcement-banner";
import { OpenSourceBadge } from "./_components/open-source-badge";
import { GitHubStars } from "./_components/github-stars";
import { NpmDownloads } from "./_components/npm-downloads";
import { ComparisonSection } from "./_components/comparison-section";
import { TemplatesSection } from "./_components/templates-section";
import { FAQSection } from "./_components/faq-section";

const GITHUB_URL = "https://github.com/stackbase-labs/stackbase";
const INSTALL_COMMAND = "pnpm dlx stackbase@latest init my-saas";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Announcement Banner */}
      <AnnouncementBanner />

      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <GridBackground />
        <div className="mx-auto max-w-5xl px-4 pb-16 pt-20 text-center md:pt-28">
          <Reveal>
            <Eyebrow>From Zero to Production</Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mt-6 text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              The production-ready monorepo.{" "}
              <span className="bg-linear-to-r from-primary to-primary/60 bg-clip-text">
                One command. Everything wired.
              </span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
              Stop rebuilding auth, databases, Docker configs, and API
              middleware. Scaffold a complete Turborepo with Better Auth,
              Prisma, Express, and Kubernetes in minutes.
            </p>
          </Reveal>
          <Reveal delay={0.13}>
            <div className="mt-6 flex items-center justify-center gap-3">
              <OpenSourceBadge />
              <NpmDownloads />
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <InstallBar className="mt-8" />
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/docs">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2"
                >
                  <SiGithub className="size-4" />
                  GitHub
                  <GitHubStars />
                </Link>
              </Button>
            </div>
          </Reveal>
          <Reveal delay={0.25} className="mt-16">
            <AnimatedTerminal />
          </Reveal>
        </div>
      </section>

      {/* Tech stack strip */}
      <section className="border-y border-border/40 bg-muted/20 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal>
            <p className="mb-8 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Built on a modern, production-grade stack
            </p>
            <TechLogos />
          </Reveal>
        </div>
      </section>

      {/* Why Stackbase */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-4">
          <Reveal>
            <Eyebrow>Why Stackbase</Eyebrow>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Skip the boilerplate, keep the best practices
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              Get a production-ready foundation in minutes, without giving up
              control over your stack.
            </p>
          </Reveal>
          <div className="mt-12 grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {WHY.map((item, i) => (
              <Reveal key={item.title} delay={(i % 3) * 0.05}>
                <FeatureCard {...item} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pain vs. Relief Comparison */}
      <ComparisonSection />

      {/* End-to-End Lifecycle */}
      <LifecycleSection />

      {/* End-to-End Type Safety */}
      <TypeFlowSection />

      {/* Template Gallery */}
      <TemplatesSection />

      {/* What you get */}
      <section className="border-t border-border/40 bg-muted/20 py-24">
        <div className="mx-auto max-w-5xl px-4">
          <Reveal>
            <Eyebrow>What you get</Eyebrow>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything wired up, out of the box
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              Every layer of a real product, pre-configured and working
              together.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {INCLUDED.map((item, i) => (
              <Reveal key={item.title} delay={(i % 2) * 0.05}>
                <IncludedItem {...item} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-4">
          <Reveal>
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Three steps from zero to deployed
            </h2>
          </Reveal>
          <div className="relative mt-12">
            {/* connecting line */}
            <div
              aria-hidden
              className="absolute bottom-6 left-6 top-6 w-px bg-border/60"
            />
            <div className="space-y-10">
              {STEPS.map((step, i) => (
                <Reveal key={step.number} delay={i * 0.05}>
                  <StepItem {...step} />
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQSection />

      {/* CTA */}
      <section className="bg-background px-4 py-24">
        <div className="relative isolate mx-auto max-w-5xl overflow-hidden rounded-3xl border border-border/60 bg-background px-6 py-20 text-center text-foreground">
          <GridBackground className="opacity-50" />
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Stop configuring. Ship your product today.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              100% free and open source under the MIT license. Self-host
              anywhere. No paywalls, no upsells, and zero vendor lock-in.
            </p>
            <InstallBar className="mt-8 text-foreground" />
            <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/docs">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="border-border/60 bg-background text-foreground hover:bg-muted hover:text-foreground"
                >
                  <SiGithub className="mr-2 size-4" />
                  Star on GitHub
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

/* Data */

const WHY = [
  {
    icon: <Terminal className="h-5 w-5" />,
    title: "CLI-first approach",
    description:
      "Interactive prompts guide you through setup. No configuration files to write. Just answer a few questions and go.",
  },
  {
    icon: <Layers className="h-5 w-5" />,
    title: "Opinionated structure",
    description:
      "A monorepo with clear separation of concerns and best practices baked in from the start.",
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: "Essentials built-in",
    description:
      "Auth, email, rate limiting, and environment handling configured out of the box, saving you 20+ hours of setup.",
  },
  {
    icon: <Box className="h-5 w-5" />,
    title: "Extensible templates",
    description:
      "Choose base, web, or api. Start from a solid foundation and customize freely, without fighting the setup.",
  },
  {
    icon: <Code2 className="h-5 w-5" />,
    title: "Modern stack",
    description:
      "TypeScript, React 19, Next.js 16, Tailwind v4, and Better Auth, all on current versions.",
  },
  {
    icon: <GitBranch className="h-5 w-5" />,
    title: "CI-ready with upgrades",
    description:
      "Pre-configured CI/CD workflows and stackbase upgrade to keep your project in sync with upstream improvements.",
  },
] as const;

const INCLUDED = [
  // Foundation
  {
    icon: <Package className="h-5 w-5" />,
    title: "Turborepo monorepo",
    description:
      "Optimized build system with caching, parallel execution, and task pipelining. Share code across apps and packages.",
    href: "/docs/getting-started/structure",
  },
  {
    icon: <FileCode className="h-5 w-5" />,
    title: "Type-safe environments",
    description:
      "Validated environment variables with fail-fast startup, and separate local and production configs.",
    href: "/docs/configuration/environment-variables",
  },
  // Backend core
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "Authentication & security",
    description:
      "Better Auth with Google OAuth, email verification, TOTP two-factor, and database-backed sessions with protected routes.",
    href: "/docs/packages/auth",
  },
  {
    icon: <Database className="h-5 w-5" />,
    title: "Prisma + PostgreSQL",
    description:
      "A type-safe database layer with an auto-generated client, migrations, and Prisma Studio for browsing your data.",
    href: "/docs/packages/db",
  },
  // Services
  {
    icon: <Mail className="h-5 w-5" />,
    title: "Transactional email",
    description:
      "React Email templates delivered through Resend, with a local preview server for designing emails.",
    href: "/docs/packages/email",
  },
  {
    icon: <Gauge className="h-5 w-5" />,
    title: "Rate limiting",
    description:
      "Per-IP sliding-window rate limiting backed by Upstash Redis, wired into the API middleware.",
    href: "/docs/packages/rate-limit",
  },
  // Frontend
  {
    icon: <Component className="h-5 w-5" />,
    title: "UI component library",
    description:
      "A shared shadcn/ui and Tailwind CSS component package used consistently across every app.",
    href: "/docs/packages/ui",
  },
  {
    icon: <BookOpen className="h-5 w-5" />,
    title: "Documentation site",
    description:
      "A Fumadocs-powered docs app, ready for your own content out of the box.",
    href: "/docs/applications",
  },
  // Observability & quality
  {
    icon: <ScrollText className="h-5 w-5" />,
    title: "Structured logging",
    description:
      "A shared pino-based logger with structured, leveled output, adopted across the API for production-ready observability.",
    href: "/docs/packages/logger",
  },
  {
    icon: <FlaskConical className="h-5 w-5" />,
    title: "Testing, linting & formatting",
    description:
      "Vitest, ESLint, Prettier, and TypeScript strict mode. Catch errors before they ship.",
    href: "/docs/configuration/formatting",
  },
  // Ship & CI
  {
    icon: <Ship className="h-5 w-5" />,
    title: "Docker & Kubernetes",
    description:
      "Compose files for local and production, plus Kubernetes manifests with autoscaling (HPA) and one-command deploy and verify.",
    href: "/docs/configuration/docker",
  },
  {
    icon: <GitBranch className="h-5 w-5" />,
    title: "GitHub Actions CI",
    description:
      "Pre-configured pipelines for linting, type checking, testing, and build on every push and pull request.",
    href: "/docs/getting-started/first-steps",
  },
] as const;

const STEPS = [
  {
    number: "01",
    title: "Install and initialize",
    description:
      "Run a single command to create your project. The CLI walks you through your package manager and template-aware options for Docker, Kubernetes, Observability, and Prisma Studio.",
  },
  {
    number: "02",
    title: "Pick a template",
    description:
      "Choose base (full-stack), web, or api. Everything is pre-configured and each template is standalone with dedicated resources.",
  },
  {
    number: "03",
    title: "Start building",
    description:
      "Your project is ready with authentication, API routes, database schema, and CI/CD. Focus on features, not infrastructure.",
  },
] as const;

/* Presentational Components */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block font-mono text-xs font-medium uppercase tracking-widest text-primary">
      [ {children} ]
    </span>
  );
}

function InstallBar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-md items-center justify-between gap-3 rounded-lg border border-border/60 bg-card/60 p-1.5 pl-4 font-mono text-sm backdrop-blur",
        className,
      )}
    >
      <span className="truncate">
        <span className="select-none text-primary">$ </span>
        {INSTALL_COMMAND}
      </span>
      <CopyButton value={INSTALL_COMMAND} />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative h-full overflow-hidden rounded-xl border border-border/50 bg-card p-6 transition-colors hover:border-primary/40 hover:bg-muted/40">
      <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-2 text-primary transition-transform group-hover:scale-110">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function IncludedItem({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href?: string;
}) {
  const content = (
    <>
      <div className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>
      <div className="flex-1">
        <h3 className="font-semibold group-hover:text-primary transition-colors">
          {title}
          {href && (
            <ArrowRight className="ml-1 inline size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
          )}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="group flex items-start gap-4">
        {content}
      </Link>
    );
  }

  return <div className="flex items-start gap-4">{content}</div>;
}

function StepItem({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-6">
      <div className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-card font-mono text-sm font-semibold text-primary">
        {number}
      </div>
      <div className="flex-1 pt-1">
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="mt-2 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
