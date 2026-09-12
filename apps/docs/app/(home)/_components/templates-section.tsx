"use client";

import { Reveal } from "./reveal";
import { Check, Star } from "lucide-react";

const templates = [
  {
    id: "base",
    name: "base",
    title: "Full-Stack Starter",
    bestFor: "Complete application starter",
    includes: [
      "Next.js Web App",
      "Express API",
      "Auth & 2FA",
      "Database & ORM",
      "Email Templates",
      "UI Components",
      "Rate Limiting",
      "Storage",
      "Docker & K8s",
      "Observability",
      "CI/CD",
    ],
    recommended: true,
  },
  {
    id: "web",
    name: "web",
    title: "Web Application",
    bestFor: "Frontend-led products",
    includes: [
      "Next.js Web App",
      "Auth & 2FA",
      "Database & ORM",
      "Email Templates",
      "UI Components",
      "Storage",
      "Docker",
    ],
    recommended: false,
  },
  {
    id: "api",
    name: "api",
    title: "API Service",
    bestFor: "Backend services & microservices",
    includes: [
      "Express API",
      "Auth & 2FA",
      "Database & ORM",
      "Rate Limiting",
      "Storage",
      "Contracts",
      "Docker",
      "Observability",
      "CI/CD",
    ],
    recommended: false,
  },
];

export function TemplatesSection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-4">
        <Reveal>
          <div className="flex flex-col items-center text-center">
            <span className="inline-block font-mono text-xs font-medium uppercase tracking-widest text-primary mb-4">
              [ Templates ]
            </span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
              Choose your starting point
            </h2>
            <p className="text-lg text-muted-foreground max-w-150">
              Three standalone templates, each optimized for a different
              architecture.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`flex flex-col rounded-xl border p-6 bg-card relative ${
                  template.recommended
                    ? "border-primary/40 ring-1 ring-primary/20"
                    : "border-border/50"
                }`}
              >
                {template.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm whitespace-nowrap">
                    <Star className="size-3 fill-current" />
                    Recommended
                  </div>
                )}

                <div className="mb-4 flex items-start">
                  <span className="rounded-full bg-primary/10 px-3 py-1 font-mono text-xs font-semibold text-primary">
                    {template.name}
                  </span>
                </div>

                <h3 className="mb-1 text-xl font-bold text-foreground">
                  {template.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-6 min-h-10">
                  {template.bestFor}
                </p>

                <div className="h-px w-full bg-border/50 mb-6" />

                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground mb-4">
                    Includes:
                  </p>
                  <ul className="space-y-2 mb-8">
                    {template.includes.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="size-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
