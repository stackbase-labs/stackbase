import { Geist, Geist_Mono } from 'next/font/google';

import { Providers } from '@/components/auth/providers';
import Header from '@/components/layout/header';
import { generatePageMetadata, pageMetadata } from '@/config/metadata';
import { config, siteConfig } from '@/config/site';
import { viewportConfig } from '@/config/viewport';
import '@workspace/ui/globals.css';
import { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  ...siteConfig,
  ...generatePageMetadata(pageMetadata.home.title, pageMetadata.home.description),
};

export const viewport: Viewport = viewportConfig;

const fontSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}>
        <Providers>
          <main className="flex h-screen w-screen flex-col">
            {(config.layout?.showHeader ?? true) ? <Header /> : null}
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
