"use client";

import { Check, Copy, RotateCcw, WrapText } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { cn } from "@/lib/cn";
import { runners, type Runner } from "../command-builder";

export const runnerLabels: Record<Runner, string> = {
  pnpm: "pnpm",
  npm: "npm",
  bun: "bun",
};

export function TerminalCard({
  command,
  runner,
  onRunnerChange,
  multiLine,
  onToggleMultiLine,
  onReset,
  onCopy,
  copied,
  disableCopy = false,
}: {
  command: string;
  runner: Runner;
  onRunnerChange: (runner: Runner) => void;
  multiLine: boolean;
  onToggleMultiLine: () => void;
  onReset: () => void;
  onCopy: () => void;
  copied: boolean;
  disableCopy?: boolean;
}) {
  return (
    <div className="bg-card mt-3 border rounded-lg overflow-hidden shadow-xs">
      <div className="flex h-11 items-center justify-between border-b px-2.5 bg-muted/20 gap-2">
        <div
          role="group"
          aria-label="CLI Runner"
          className="bg-muted/70 p-0.5 rounded-md inline-flex gap-0.5"
        >
          {runners.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onRunnerChange(r)}
              className={cn(
                "px-2 py-0.5 text-[11px] font-mono rounded transition-all cursor-pointer",
                runner === r
                  ? "bg-background text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {runnerLabels[r]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={
              multiLine ? "Switch to single-line" : "Format with line breaks"
            }
            title={
              multiLine
                ? "Switch to single-line"
                : "Format with line continuations (\\)"
            }
            onClick={onToggleMultiLine}
            className={cn(
              "transition-colors",
              multiLine && "bg-muted text-foreground",
            )}
          >
            <WrapText className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Reset options to defaults"
            title="Reset to defaults"
            onClick={onReset}
          >
            <RotateCcw className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={copied ? "Command copied" : "Copy command"}
            disabled={disableCopy}
            onClick={onCopy}
          >
            {copied ? (
              <Check className="size-4 text-emerald-500" />
            ) : (
              <Copy className="size-4" />
            )}
          </Button>
        </div>
      </div>
      <pre
        className="min-h-36 p-4 font-mono text-sm leading-6.5 wrap-break-words whitespace-pre-wrap select-text bg-muted/10"
        aria-live="polite"
      >
        <CommandTokens command={command} />
      </pre>
    </div>
  );
}

export function CommandTokens({ command }: { command: string }) {
  const lines = command.split("\n");

  return (
    <>
      {lines.map((line, lineIndex) => {
        const tokens = line.trim().split(" ");
        return (
          <span key={lineIndex} className="block">
            {lineIndex === 0 && (
              <span className="text-muted-foreground/60 select-none">$ </span>
            )}
            {lineIndex > 0 && (
              <span className="text-muted-foreground/30 select-none"> </span>
            )}
            {tokens.map((token, tokenIndex) => {
              let color = "text-foreground";
              if (
                token === "pnpm" ||
                token === "npx" ||
                token === "bunx" ||
                token === "dlx"
              ) {
                color = "text-sky-500 dark:text-sky-400 font-semibold";
              } else if (token.startsWith("stackbase")) {
                color = "text-violet-500 dark:text-violet-400 font-semibold";
              } else if (["init", "add", "doctor", "upgrade"].includes(token)) {
                color = "text-emerald-600 dark:text-emerald-400 font-semibold";
              } else if (token.startsWith("--") || token.startsWith("-")) {
                color = "text-indigo-500 dark:text-indigo-300";
              } else if (token === "\\") {
                color = "text-muted-foreground/50";
              } else if (
                tokenIndex === 0 ||
                (lineIndex === 0 &&
                  tokenIndex === tokens.length - 1 &&
                  !token.startsWith("-"))
              ) {
                color = "text-amber-500 dark:text-amber-300 font-medium";
              }

              return (
                <span key={tokenIndex}>
                  <span className={color}>{token}</span>
                  {tokenIndex < tokens.length - 1 ? " " : ""}
                </span>
              );
            })}
          </span>
        );
      })}
    </>
  );
}
