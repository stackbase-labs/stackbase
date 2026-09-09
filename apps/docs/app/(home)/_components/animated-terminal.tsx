"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Terminal } from "lucide-react";

const COMMAND = "pnpm dlx stackbase@latest init my-saas";

const OUTPUT_LINES = [
  { text: "✓ Initializing project structure...", muted: true },
  { text: "✓ Setting up monorepo configuration...", muted: true },
  { text: "✓ Installing dependencies...", muted: true },
  { text: "✓ Configuring project settings...", muted: true },
  { text: "🎉 Project ready! Run cd my-saas && pnpm dev", muted: false },
];

const TYPING_MS = 38;
const LINE_MS = 420;

export function AnimatedTerminal() {
  const reduceMotion = useReducedMotion();
  const [typed, setTyped] = useState(0);
  const [visibleLines, setVisibleLines] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (reduceMotion) {
      setTyped(COMMAND.length);
      setVisibleLines(OUTPUT_LINES.length);
      return;
    }

    const queued = timers.current;

    // Type the command one character at a time.
    for (let i = 1; i <= COMMAND.length; i++) {
      queued.push(setTimeout(() => setTyped(i), i * TYPING_MS));
    }

    // Then reveal the output lines one by one.
    const afterTyping = COMMAND.length * TYPING_MS + 350;
    for (let i = 1; i <= OUTPUT_LINES.length; i++) {
      queued.push(
        setTimeout(() => setVisibleLines(i), afterTyping + i * LINE_MS),
      );
    }

    return () => {
      queued.forEach(clearTimeout);
      queued.length = 0;
    };
  }, [reduceMotion]);

  const commandDone = typed >= COMMAND.length;

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      {/* glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 -z-10 rounded-3xl bg-primary/10 blur-2xl"
      />
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card/80 shadow-2xl shadow-primary/5 backdrop-blur">
        {/* title bar */}
        <div className="flex items-center gap-2 border-b border-border/60 bg-muted/40 px-4 py-3">
          <span className="size-3 rounded-full bg-red-400/80" />
          <span className="size-3 rounded-full bg-amber-400/80" />
          <span className="size-3 rounded-full bg-emerald-400/80" />
          <div className="ml-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Terminal className="size-3.5" />
            <span className="font-mono">bash</span>
          </div>
        </div>

        {/* body */}
        <div className="space-y-2 p-5 text-left font-mono text-sm leading-relaxed sm:p-6">
          <div className="flex items-start gap-2">
            <span className="select-none text-primary">$</span>
            <span className="break-all">
              <span className="text-foreground">{COMMAND.slice(0, typed)}</span>
              {!commandDone && (
                <span className="ml-px inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-foreground/70" />
              )}
              <span className="invisible select-none" aria-hidden="true">
                {COMMAND.slice(typed)}
              </span>
            </span>
          </div>

          <div className="space-y-1">
            {OUTPUT_LINES.map((line, index) => {
              const isVisible = index < visibleLines;
              const showLineCursor =
                commandDone &&
                index === visibleLines &&
                visibleLines < OUTPUT_LINES.length;

              return (
                <div key={line.text} className="relative">
                  <div
                    className={
                      isVisible
                        ? line.muted
                          ? "text-muted-foreground"
                          : "text-foreground"
                        : "invisible select-none"
                    }
                    aria-hidden={!isVisible}
                  >
                    {line.text}
                  </div>
                  {showLineCursor && (
                    <span className="absolute left-0 top-0 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-foreground/70" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
