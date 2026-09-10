import { keys } from './keys';

export interface EmailServiceConfig {
  resendToken: string;
  defaultFromAddress: string;
  isDevelopment: boolean;
}

export const loadEmailConfig = (): EmailServiceConfig => {
  const resendToken = keys().RESEND_TOKEN;
  const defaultFromAddress = keys().RESEND_EMAIL_FROM;
  const isDevelopment = keys().NODE_ENV === 'development';

  if (!resendToken) {
    throw new Error(
      'RESEND_TOKEN is not defined in environment variables. ' +
        'Please add RESEND_TOKEN to your .env file.',
    );
  }

  return {
    resendToken,
    defaultFromAddress: defaultFromAddress || '',
    isDevelopment,
  };
};
