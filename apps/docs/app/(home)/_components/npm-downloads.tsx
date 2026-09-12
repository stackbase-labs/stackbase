import { Download } from "lucide-react";
import { cn } from "@/lib/cn";

async function getDownloads(): Promise<number | null> {
  try {
    const res = await fetch(
      "https://api.npmjs.org/downloads/point/last-month/stackbase",
      { next: { revalidate: 3600 } },
    );

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as { downloads?: unknown };
    return typeof data.downloads === "number" ? data.downloads : null;
  } catch {
    return null;
  }
}

function formatDownloads(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, "")}M+`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1).replace(/\.0$/, "")}k+`;
  }
  return count.toString();
}

export async function NpmDownloads({ className }: { className?: string }) {
  const count = await getDownloads();

  if (count === null) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground",
        className,
      )}
    >
      <Download className="size-3.5" />
      <span>{formatDownloads(count)} monthly downloads</span>
    </span>
  );
}
