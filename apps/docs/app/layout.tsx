import type { Metadata } from "next";
import { RootProvider } from "fumadocs-ui/provider/next";
import "./global.css";
import { Geist, Geist_Mono } from "next/font/google";
import { cn } from "@/lib/cn";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://stackbase-labs.vercel.app",
  ),
  title: {
    template: "%s | Stackbase",
    default: "Stackbase — The Open-Source Foundation for Modern Monorepos",
  },
  description:
    "A CLI that scaffolds scalable Turborepos with authentication, infrastructure, and best practices built in.",
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/icon.png", type: "image/png" }],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Stackbase — The Open-Source Foundation for Modern Monorepos",
    description:
      "A CLI that scaffolds scalable Turborepos with authentication, infrastructure, and best practices built in.",
    url:
      process.env.NEXT_PUBLIC_SITE_URL || "https://stackbase-labs.vercel.app",
    siteName: "Stackbase",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Stackbase",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stackbase — The Open-Source Foundation for Modern Monorepos",
    description:
      "A CLI that scaffolds scalable Turborepos with authentication, infrastructure, and best practices built in.",
    images: ["/og-image.png"],
  },
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(fontSans.variable, fontMono.variable)}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
