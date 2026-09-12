import { cn } from "@/lib/cn";

export function OpenSourceBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur",
        className,
      )}
    >
      <span
        aria-hidden
        className="size-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]"
      />
      100% Free & Open Source · MIT Licensed
    </span>
  );
}
