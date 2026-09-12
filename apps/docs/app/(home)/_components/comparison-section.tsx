"use client";

import { Reveal } from "./reveal";
import { Clock, Zap, Check } from "lucide-react";

const FROM_SCRATCH_ITEMS = [
  { time: "4 hrs", desc: "Turborepo workspace, task pipelines, caching" },
  { time: "4 hrs", desc: "Auth setup, OAuth, email verification, 2FA" },
  { time: "3 hrs", desc: "Prisma schema, migrations, Studio integration" },
  { time: "3 hrs", desc: "Express API, middleware, CORS, health checks" },
  { time: "2 hrs", desc: "Docker Compose, production Dockerfiles" },
  { time: "2 hrs", desc: "GitHub Actions CI/CD pipelines" },
  { time: "2 hrs", desc: "React Email templates + Resend wiring" },
  { time: "1 hr", desc: "Rate limiting, Redis, env validation" },
] as const;

const INCLUDED_FEATURES = [
  "Auth & 2FA",
  "Database & ORM",
  "Express API",
  "Email Templates",
  "Docker & K8s",
  "CI/CD Pipelines",
  "Rate Limiting",
  "UI Components",
  "Type Safety",
  "Observability",
] as const;

export function ComparisonSection() {
  return (
    <section className="border-t border-border/40 bg-muted/20 py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <Reveal className="flex flex-col items-center text-center">
          <span className="inline-block font-mono text-xs font-medium uppercase tracking-widest text-primary mb-4">
            [ Save 20+ Hours ]
          </span>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4 text-foreground">
            What you skip when you use Stackbase
          </h2>
          <p className="max-w-2xl text-muted-foreground sm:text-xl sm:leading-8">
            Every Stackbase project includes what would take days to configure
            manually.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {/* Left Column: Building from scratch */}
          <Reveal delay={0.1}>
            <div className="rounded-xl border border-border/50 bg-card p-6 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="h-6 w-6 text-destructive" />
                <h3 className="text-xl font-semibold text-destructive">
                  Building from scratch
                </h3>
              </div>

              <ul className="space-y-4 flex-1">
                {FROM_SCRATCH_ITEMS.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex items-center justify-center h-6 min-w-14 rounded-md bg-destructive/10 text-destructive text-xs font-medium font-mono">
                      {item.time}
                    </span>
                    <span className="text-muted-foreground text-sm leading-6">
                      {item.desc}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 pt-6 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-destructive">
                    ~21+ hours of setup
                  </span>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Right Column: Using Stackbase */}
          <Reveal delay={0.2}>
            <div className="rounded-xl border border-primary/40 bg-card p-6 ring-1 ring-primary/20 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <Zap className="h-6 w-6 text-primary fill-primary/20" />
                <h3 className="text-xl font-semibold text-primary">
                  Using Stackbase
                </h3>
              </div>

              <div className="space-y-6 flex-1">
                <div className="rounded-md bg-muted/40 border border-border/50 p-4 overflow-x-auto">
                  <code className="text-foreground font-mono text-sm whitespace-nowrap">
                    <span className="text-primary select-none">$ </span>
                    pnpm dlx stackbase@latest init my-saas
                  </code>
                </div>

                <div>
                  <p className="text-lg font-bold text-foreground mb-4">
                    Ready in minutes. Everything configured.
                  </p>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {INCLUDED_FEATURES.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm font-medium text-muted-foreground">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
