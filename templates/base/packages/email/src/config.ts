import { keys } from './keys';

export interface EmailServiceConfig {
  resendToken: string;
  defaultFromAddress: string;
  isDevelopment: boolean;
}

export function isDevPlaceholderToken(token?: string): boolean {
  if (!token) return true;
  return (
    token.startsWith('re_xxxx') ||
    token === 're_local_dev' ||
    token === 'dev' ||
    token === 'development'
  );
}

export const loadEmailConfig = (): EmailServiceConfig => {
  const resendToken = keys().RESEND_TOKEN;
  const defaultFromAddress = keys().RESEND_EMAIL_FROM;
  const isDevelopment = (keys().NODE_ENV || process.env.NODE_ENV) === 'development';

  if (!resendToken && !isDevelopment) {
    throw new Error(
      'RESEND_TOKEN is not defined in environment variables. ' +
        'Please add RESEND_TOKEN to your .env file.',
    );
  }

  return {
    resendToken: resendToken || 're_local_dev',
    defaultFromAddress: defaultFromAddress || 'delivered@resend.dev',
    isDevelopment,
  };
};
