import { Metadata } from 'next';
import {
  BASE_URL,
  DEFAULT_OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_NAME,
  formatSiteTitle,
  toAbsoluteUrl,
} from './site-shared';

export const generatePageMetadata = (
  title: string,
  description: string,
  options?: {
    ogImage?: string;
    noindex?: boolean;
  },
): Metadata => {
  const ogImage = toAbsoluteUrl(options?.ogImage ?? DEFAULT_OG_IMAGE);
  const formattedTitle = formatSiteTitle(title);

  return {
    title: formattedTitle,
    description,
    robots: {
      index: !options?.noindex,
      follow: true,
    },
    openGraph: {
      title: formattedTitle,
      description,
      url: BASE_URL,
      siteName: SITE_NAME,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: formattedTitle,
      description,
      images: [ogImage],
    },
  };
};

// Page-specific metadata
export const pageMetadata = {
  home: {
    title: 'Stackbase | Fullstack Turborepo Starter Template',
    description: SITE_DESCRIPTION,
  },
  dashboard: {
    title: 'Dashboard',
    description: 'Manage your account and view your dashboard.',
  },
  profile: {
    title: 'Profile',
    description: 'View and edit your profile information.',
  },
  settings: {
    general: {
      title: 'General Settings',
      description: 'Update your general account settings and preferences.',
    },
    security: {
      title: 'Security Settings',
      description: 'Manage your account security, passwords, and sessions.',
    },
    activity: {
      title: 'Activity',
      description: 'View your account activity and login history.',
    },
  },
  auth: {
    signIn: {
      title: 'Sign In',
      description: 'Sign in to your Stackbase account.',
    },
    signUp: {
      title: 'Sign Up',
      description: 'Create a new stackbase account.',
    },
    forgotPassword: {
      title: 'Forgot Password',
      description: 'Reset your password.',
    },
    resetPassword: {
      title: 'Reset Password',
      description: 'Create a new password for your account.',
    },
    twoFactor: {
      title: 'Two-Factor Authentication',
      description: 'Enter your two-factor authentication code to verify your identity.',
    },
  },
  goodbye: {
    title: 'Account Deleted',
    description: 'Your account has been successfully deleted.',
  },
  notFound: {
    title: '404 - Page Not Found',
    description: 'The page you are looking for could not be found.',
  },
  error: {
    title: 'Error',
    description: 'An error occurred while processing your request.',
  },
};
