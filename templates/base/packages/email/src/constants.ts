import {
  ChangeEmailTemplate,
  ResetPasswordTemplate,
  VerificationEmail,
  WelcomeTemplate,
} from './templates';
import type {
  ChangeEmailProps,
  EmailType,
  ResetPasswordProps,
  VerificationEmailProps,
  WelcomeEmailProps,
} from './types';

export const EmailTypes = ['welcome', 'verify-email', 'change-email', 'reset-password'] as const;

export const emailTemplates = {
  welcome: {
    subject: 'Welcome!',
    render: (props: WelcomeEmailProps) => WelcomeTemplate(props),
  },
  'verify-email': {
    subject: 'Verify your email address',
    render: (props: VerificationEmailProps) => VerificationEmail(props),
  },
  'change-email': {
    subject: 'Confirm your email address change',
    render: (props: ChangeEmailProps) => ChangeEmailTemplate(props),
  },
  'reset-password': {
    subject: 'Reset your password',
    render: (props: ResetPasswordProps) => ResetPasswordTemplate(props),
  },
} as const;

export type EmailTemplatesMap = typeof emailTemplates;

// Overloaded function for type-safe template lookup
export function getEmailTemplate(type: 'welcome'): (typeof emailTemplates)['welcome'];
export function getEmailTemplate(type: 'verify-email'): (typeof emailTemplates)['verify-email'];
export function getEmailTemplate(type: 'change-email'): (typeof emailTemplates)['change-email'];
export function getEmailTemplate(type: 'reset-password'): (typeof emailTemplates)['reset-password'];
export function getEmailTemplate(type: EmailType) {
  return emailTemplates[type];
}
