import { SITE_URL, versionAnchor } from "@/lib/changelog";
import { getSortedChangelogPages, type ChangelogPage } from "@/lib/source";

const FEED_TITLE = "Stackbase Changelog";
const FEED_DESC = "All changes, fixes and updates to Stackbase.";
const CHANGELOG_URL = `${SITE_URL}/changelog`;
const FEED_URL = `${CHANGELOG_URL}/rss.xml`;

/** Escapes the five XML predefined entities. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Converts inline markdown (code, links, bold, italic) to safe HTML for RSS. */
function markdownToHtml(text: string): string {
  const escaped = escapeXml(text);
  return escaped
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

/** Renders a release's description for RSS readers. */
function renderDescription(page: ChangelogPage): string {
  if (page.data.summary) {
    return `<p>${markdownToHtml(page.data.summary)}</p>`;
  }
  return `<p>${escapeXml(page.data.title)}</p>`;
}

function renderItem(page: ChangelogPage): string {
  const url = `${CHANGELOG_URL}#${versionAnchor(page.data.version)}`;
  const pubDate = new Date(`${page.data.date}T00:00:00Z`).toUTCString();
  const title = escapeXml(`v${page.data.version} — ${page.data.title}`);

  return `    <item>
      <title>${title}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${renderDescription(page)}]]></description>
    </item>`;
}

export const dynamic = "force-static";

export function GET(): Response {
  const pages = getSortedChangelogPages();
  const latest = pages[0];
  const lastBuildDate = latest
    ? new Date(`${latest.data.date}T00:00:00Z`).toUTCString()
    : new Date().toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${CHANGELOG_URL}</link>
    <description>${escapeXml(FEED_DESC)}</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${FEED_URL}" rel="self" type="application/rss+xml" />
${pages.map(renderItem).join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
