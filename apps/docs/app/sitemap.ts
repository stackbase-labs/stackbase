import type { MetadataRoute } from "next";
import { changelogSource, source } from "@/lib/source";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://stackbase-labs.vercel.app";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/changelog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const docRoutes: MetadataRoute.Sitemap = source.getPages().map((page) => ({
    url: `${baseUrl}${page.url}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: page.url === "/docs" ? 0.9 : 0.7,
  }));

  const changelogRoutes: MetadataRoute.Sitemap = changelogSource
    .getPages()
    .map((page) => ({
      url: `${baseUrl}${page.url}`,
      lastModified: page.data.date ? new Date(page.data.date) : new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    }));

  return [...staticRoutes, ...docRoutes, ...changelogRoutes];
}
