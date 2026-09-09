export type ReleaseTag =
  | "latest"
  | "major"
  | "minor"
  | "patch"
  | "yanked"
  | "security";

/** Canonical site origin, used for changelog metadata and the RSS feed. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://stackbase-labs.vercel.app";

/** Stable anchor id for a release version (e.g. "1.3.0" → "v1-3-0"). */
export function versionAnchor(version: string): string {
  return `v${version.replace(/\./g, "-")}`;
}

/** Formats an ISO date string as a human-readable date (e.g. "June 6, 2026"). */
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
