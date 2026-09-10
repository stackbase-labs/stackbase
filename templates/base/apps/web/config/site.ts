import { Home } from 'lucide-react';
import { Metadata } from 'next';
import {
  BASE_URL,
  DEFAULT_OG_IMAGE,
  DOMAIN,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  toAbsoluteUrl,
} from './site-shared';

export const siteConfig: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  icons: {
    icon: [{ url: '/favicon.ico' }],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
  metadataBase: new URL(BASE_URL),
  keywords: SITE_KEYWORDS,
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: BASE_URL,
    siteName: SITE_NAME,
    images: [
      {
        url: toAbsoluteUrl(DEFAULT_OG_IMAGE),
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [toAbsoluteUrl(DEFAULT_OG_IMAGE)],
  },
};

export type SidebarCollapsibleMode = 'offcanvas' | 'icon' | 'none';

export type LayoutConfig = {
  showHeader: boolean;
  sidebarCollapsible: SidebarCollapsibleMode;
};

export const config = {
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  baseUrl: BASE_URL,
  domain: DOMAIN,
  layout: {
    showHeader: true, // set --header-height in globals.css (custom or default: 3.5rem) when true, 0rem when false)
    sidebarCollapsible: 'offcanvas',
  } as LayoutConfig,
  providers: [
    {
      id: 'google',
      name: 'Google',
    },
  ],
  nav: [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: Home,
    },
  ],
};
