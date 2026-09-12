"use client";

import { Reveal } from "./reveal";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How is Stackbase different from Create T3 App?",
    answer:
      "T3 is great for a single Next.js app using tRPC. Stackbase is designed for when you need a real monorepo: a standalone Express API, shared package workspace, Docker/K8s configs, and an upgrade CLI to pull upstream improvements later.",
  },
  {
    question: "Why Better Auth instead of NextAuth or Clerk?",
    answer:
      "Better Auth runs directly against your database via Prisma. You aren't paying monthly active user (MAU) fees to Clerk, and you get two-factor auth (TOTP), session management, and email verification out of the box.",
  },
  {
    question: "Is Stackbase really free?",
    answer:
      "Yes, completely. It's licensed under MIT. You can use it for personal projects, client work, or commercial products without restrictions or paid tiers.",
  },
  {
    question: "How does stackbase upgrade work?",
    answer:
      "When you scaffold a project, the CLI records your template commit in .stackbase.json. Running stackbase upgrade runs a 3-way git merge between your code, the original template, and the latest release so you can pull bugfixes without overwriting your custom changes.",
  },
  {
    question: "Do I need Docker or Kubernetes?",
    answer:
      "Not at all. For day-to-day dev, you just run pnpm dev. Docker and Kubernetes are optional prompts during stackbase init for when you're ready to containerize or deploy to production.",
  },
  {
    question: "What templates are available?",
    answer:
      "There are three: base (the full monorepo with Next.js frontend, Express API, and all shared packages), web (just the Next.js app and database), and api (standalone Express API service).",
  },
  {
    question: "Can I add or remove packages after scaffolding?",
    answer:
      "Yes. It's a standard Turborepo. You can delete any folder in packages/ you don't need or drop in new ones, then update pnpm-workspace.yaml as usual.",
  },
  {
    question: "Can I use Drizzle instead of Prisma?",
    answer:
      "Prisma is the default because it's already wired up with Better Auth and migrations. You can swap it out for Drizzle inside packages/db, but Prisma is what comes configured out of the box.",
  },
];

export function FAQSection() {
  return (
    <section className="border-t border-border/40 bg-muted/20 py-24">
      <div className="mx-auto max-w-5xl px-4">
        <Reveal>
          <div className="mx-auto max-w-3xl">
            <div className="mb-12 flex flex-col items-center text-center">
              <span className="mb-4 inline-block font-mono text-xs font-medium uppercase tracking-widest text-primary">
                [ FAQ ]
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Frequently asked questions
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Everything you need to know about Stackbase.
              </p>
            </div>

            <div className="flex flex-col">
              {faqs.map((faq, index) => (
                <details
                  key={index}
                  className="group border-b border-border/50"
                >
                  <summary className="flex cursor-pointer items-center justify-between py-4 text-left font-medium text-foreground transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
                    {faq.question}
                    <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-200 ease-out group-open:grid-rows-[1fr]">
                    <div className="overflow-hidden">
                      <p className="pb-4 text-sm leading-relaxed text-muted-foreground">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
