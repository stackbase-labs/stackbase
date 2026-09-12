"use client";

import { useState } from "react";
import { Database, Play, Ship, Terminal } from "lucide-react";
import { CopyButton } from "./copy-button";
import { Reveal } from "./reveal";

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Scaffolding",
    cmd: "pnpm dlx stackbase init my-saas",
    desc: "Interactive CLI prompts you for database, auth providers, and monorepo packages.",
    icon: Terminal,
    output: [
      {
        text: "✓ Initializing Turborepo monorepo in ./my-saas",
        type: "success",
      },
      {
        text: "✓ Configuring Better Auth, Prisma PostgreSQL, & Express API",
        type: "success",
      },
      {
        text: "✓ Scaffolded apps/web, apps/api, and packages/contracts",
        type: "success",
      },
      {
        text: "✓ Pre-wired Docker Compose & GitHub Actions CI workflows",
        type: "success",
      },
      {
        text: "🎉 Project ready! Run cd my-saas && pnpm dev",
        type: "highlight",
      },
    ],
  },
  {
    step: "02",
    title: "Database",
    cmd: "pnpm --filter @workspace/db db:migrate",
    desc: "Applies Prisma migrations to PostgreSQL and generates typed query client.",
    icon: Database,
    output: [
      {
        text: "Prisma schema loaded from packages/db/prisma/schema.prisma",
        type: "info",
      },
      { text: "Applying migration `20240101_init`...", type: "info" },
      { text: "✓ Synchronized schema with PostgreSQL :5432", type: "success" },
      {
        text: "✓ Generated Prisma Client & types for @workspace/db",
        type: "success",
      },
      {
        text: "🎉 All migrations applied. Database is up to date.",
        type: "highlight",
      },
    ],
  },
  {
    step: "03",
    title: "Local Dev",
    cmd: "pnpm dev",
    desc: "Spins up Next.js on :3000, Express on :4000, and Docs on :3001 in parallel.",
    icon: Play,
    output: [
      { text: ">>> turbo dev", type: "info" },
      { text: "• apps/web: ready on http://localhost:3000", type: "url" },
      { text: "• apps/api: ready on http://localhost:4000", type: "url" },
      { text: "• apps/docs: ready on http://localhost:3001", type: "url" },
      {
        text: "✓ Full-stack hot reload active across all workspaces",
        type: "highlight",
      },
    ],
  },
  {
    step: "04",
    title: "Production",
    cmd: "docker compose -f docker-compose.prod.yml up -d",
    desc: "Builds multi-stage optimized Docker containers ready for Kubernetes or Fly.io.",
    icon: Ship,
    output: [
      { text: "✔ Network app_network Created", type: "info" },
      {
        text: "✔ Container stackbase-postgres Healthy (PostgreSQL 16)",
        type: "success",
      },
      {
        text: "✔ Container stackbase-api Started (:4000)",
        type: "success",
      },
      {
        text: "✔ Container stackbase-web Started (:3000)",
        type: "success",
      },
      {
        text: "🚀 Production containers running & healthy",
        type: "highlight",
      },
    ],
  },
];

export function LifecycleSection() {
  const [activeStep, setActiveStep] = useState<number>(0);
  const current = WORKFLOW_STEPS[activeStep];

  return (
    <section className="border-t border-border/40 bg-muted/20 py-24">
      <div className="mx-auto max-w-5xl px-4 space-y-12">
        <Reveal>
          <span className="inline-block font-mono text-xs font-medium uppercase tracking-widest text-primary">
            [ End-to-End Lifecycle ]
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            The 4-step developer experience
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            From initial project scaffolding to database migrations, parallel
            local dev, and multi-container deployment.
          </p>
        </Reveal>

        {/* Step Selector Cards */}
        <Reveal delay={0.05}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {WORKFLOW_STEPS.map((item, idx) => {
              const Icon = item.icon;
              const isActive = activeStep === idx;
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setActiveStep(idx)}
                  className={`group relative flex flex-col justify-between rounded-xl border p-4 text-left font-mono transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "border-primary/60 bg-card shadow-lg shadow-primary/5 ring-1 ring-primary/30"
                      : "border-border/50 bg-card/50 hover:border-primary/40 hover:bg-card/80 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-semibold ${
                        isActive ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {item.step}
                    </span>
                    <div
                      className={`rounded-lg p-1.5 transition-colors ${
                        isActive
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground group-hover:text-foreground"
                      }`}
                    >
                      <Icon className="size-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div
                      className={`text-sm font-semibold transition-colors ${
                        isActive
                          ? "text-foreground font-bold"
                          : "text-foreground/80 group-hover:text-foreground"
                      }`}
                    >
                      {item.title}
                    </div>
                    <div className="mt-1 truncate text-[11px] text-muted-foreground">
                      {item.cmd}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* Terminal Output Window */}
        <Reveal delay={0.1}>
          <div className="relative">
            <div className="overflow-hidden rounded-xl border border-border/60 bg-card/90 shadow-2xl backdrop-blur font-mono text-xs">
              {/* Window Header Bar */}
              <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-red-400/80" />
                  <span className="size-3 rounded-full bg-amber-400/80" />
                  <span className="size-3 rounded-full bg-emerald-400/80" />
                  <div className="ml-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Terminal className="size-3.5 text-primary" />
                    <span className="font-mono font-medium text-foreground">
                      bash
                    </span>
                    <span className="hidden text-muted-foreground/80 sm:inline">
                      {current.desc}
                    </span>
                  </div>
                </div>
                <CopyButton value={current.cmd} />
              </div>

              {/* Terminal Body */}
              <div className="space-y-4 p-5 sm:p-6">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="select-none text-primary font-bold">$</span>
                  <span className="text-foreground">{current.cmd}</span>
                </div>

                <div className="border-t border-border/40" />

                <div className="space-y-1.5 leading-relaxed pt-1">
                  {current.output.map((line, i) => {
                    if (line.type === "highlight") {
                      return (
                        <div key={i} className="text-foreground font-semibold">
                          {line.text}
                        </div>
                      );
                    }
                    if (line.type === "url") {
                      return (
                        <div key={i} className="text-emerald-400 font-medium">
                          {line.text}
                        </div>
                      );
                    }
                    if (line.type === "info") {
                      return (
                        <div key={i} className="text-muted-foreground">
                          {line.text}
                        </div>
                      );
                    }
                    return (
                      <div key={i} className="text-muted-foreground">
                        <span className="text-primary font-bold mr-1.5">✓</span>
                        {line.text.replace(/^[✓✔]\s*/, "")}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
