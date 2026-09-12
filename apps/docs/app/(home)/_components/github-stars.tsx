import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

async function getStarCount(): Promise<number | null> {
  try {
    const res = await fetch(
      "https://api.github.com/repos/stackbase-labs/stackbase",
      {
        next: { revalidate: 3600 },
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "stackbase-docs",
        },
      },
    );

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as { stargazers_count?: unknown };
    return typeof data.stargazers_count === "number"
      ? data.stargazers_count
      : null;
  } catch {
    return null;
  }
}

function formatCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
  }
  if (count >= 1_000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return count.toString();
}

export async function GitHubStars({ className }: { className?: string }) {
  const count = await getStarCount();

  if (count === null) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground",
        className,
      )}
    >
      <Star className="size-3.5 text-yellow-500" />
      <span>{formatCount(count)}</span>
    </span>
  );
}
