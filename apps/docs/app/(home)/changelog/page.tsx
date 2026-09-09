import type { Metadata } from "next";
import { SITE_URL } from "@/lib/changelog";
import { getSortedChangelogPages } from "@/lib/source";
import { Rss } from "lucide-react";
import { SiGithub } from "react-icons/si";
import Link from "next/link";
import { Entry } from "./_components/changelog-entry";

const GITHUB_URL = "https://github.com/stackbase-labs/stackbase";

export const metadata: Metadata = {
  title: "Changelog",
  description: "All changes, fixes and updates to Stackbase.",
  alternates: {
    canonical: `${SITE_URL}/changelog`,
    types: {
      "application/rss+xml": `${SITE_URL}/changelog/rss.xml`,
    },
  },
  openGraph: {
    title: "Changelog — Stackbase",
    description: "All changes, fixes and updates to Stackbase.",
    url: `${SITE_URL}/changelog`,
    type: "website",
  },
};

const NAV_LINKS = [
  {
    label: "GitHub Releases",
    href: `${GITHUB_URL}/releases`,
    icon: SiGithub,
    external: true,
  },
  { label: "RSS Feed", href: "/changelog/rss.xml", icon: Rss, external: false },
] as const;

export default function ChangelogPage() {
  const pages = getSortedChangelogPages();

  return (
    <div>
      <div className="relative max-w-5xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-fd-foreground mb-2">
            Changelog
          </h1>
          <p className="text-base text-fd-muted-foreground leading-relaxed max-w-sm">
            All changes, fixes and updates to Stackbase.
          </p>

          <div className="flex gap-2 mt-4">
            {NAV_LINKS.map(({ label, href, icon: Icon, external }) => (
              <Link
                key={label}
                href={href}
                {...(external
                  ? { target: "_blank", rel: "noreferrer noopener" }
                  : {})}
                className="inline-flex items-center gap-1.5 text-xs text-fd-muted-foreground hover:text-fd-foreground border border-fd-border hover:border-fd-foreground/30 rounded-md px-3 py-1.5 transition-colors"
              >
                <Icon className="w-3 h-3" />
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Entries */}
        <div>
          {pages.map((page) => (
            <Entry key={page.data.version} page={page} />
          ))}
        </div>
      </div>
    </div>
  );
}
