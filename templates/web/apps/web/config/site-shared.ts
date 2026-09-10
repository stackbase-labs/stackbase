export const SITE_NAME = 'Stackbase';
export const SITE_DESCRIPTION = 'A starter template for building applications with Turborepo.';
export const DEFAULT_BASE_URL = 'https://your-domain.com';
export const DEFAULT_OG_IMAGE = '/og-image.png';
export const SITE_KEYWORDS = [
  'turborepo',
  'starter',
  'template',
  'react',
  'typescript',
  'nextjs',
  'tailwindcss',
  'prisma',
  'postgresql',
  'shadcn/ui',
  'better-auth',
  'resend',
  'react-email',
];

const normalizeBaseUrl = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed) {
    return DEFAULT_BASE_URL;
  }

  try {
    return new URL(trimmed).origin;
  } catch {
    return DEFAULT_BASE_URL;
  }
};

const normalizeDomain = (value: string) =>
  value
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');

export const BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_BASE_URL ?? DEFAULT_BASE_URL);

export const DOMAIN =
  normalizeDomain(process.env.NEXT_PUBLIC_DOMAIN ?? '') || new URL(BASE_URL).hostname;

export const toAbsoluteUrl = (value: string, baseUrl: string = BASE_URL) => {
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  const path = value.startsWith('/') ? value : `/${value}`;

  return `${baseUrl}${path}`;
};

export const formatSiteTitle = (title: string) =>
  title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
