import { Resend } from 'resend';
import { isDevPlaceholderToken, loadEmailConfig } from './config';
import { keys } from './keys';
import { resendEmailSchema } from './schemas';
import { EmailContent } from './types';

let resendClient: Resend | null = null;
let emailConfig: ReturnType<typeof loadEmailConfig> | null = null;

function ensureServerEnvironment(): void {
  if (typeof window !== 'undefined') {
    throw new Error('sendEmail can only be called in a server environment.');
  }
}

function initEmailService() {
  ensureServerEnvironment();
  if (!emailConfig) {
    emailConfig = loadEmailConfig();
    if (emailConfig.isDevelopment) {
      console.log('📧 Email service initializing...');
    }
  }
  if (!resendClient) {
    resendClient = new Resend(emailConfig.resendToken);
    if (emailConfig.isDevelopment) {
      console.log('✅ Email service ready');
    }
  }
}

function getResendClient(): Resend {
  if (!resendClient || !emailConfig) {
    initEmailService();
  }
  if (!resendClient) {
    throw new Error('Resend client failed to initialize.');
  }
  return resendClient;
}

function getEmailConfig() {
  if (!emailConfig) {
    initEmailService();
  }
  if (!emailConfig) {
    throw new Error('Email config failed to initialize.');
  }
  return emailConfig;
}

export const sendEmail = async (email: EmailContent) => {
  const config = getEmailConfig();

  const { from } = email;

  const { data, success, error } = resendEmailSchema.safeParse(email);
  if (!success) {
    if (config?.isDevelopment) {
      console.error('❌ Invalid email parameters:', error);
    }
    throw new Error('Invalid email parameters');
  }

  // Use provided from address, config default, or environment variable
  const fromAddress = from || config.defaultFromAddress || keys().RESEND_EMAIL_FROM;
  if (!fromAddress) {
    throw new Error(
      'Email "from" address is required. Either:\n' +
        '1. Pass a "from" address in the options, or\n' +
        '2. Set RESEND_EMAIL_FROM in your environment variables',
    );
  }

  const payload = {
    ...data,
    from: fromAddress,
    html: data.html ?? '',
  };

  // Local development fallback: log email to console if placeholder or dev token is used
  if (config.isDevelopment && isDevPlaceholderToken(config.resendToken)) {
    console.log('\n✉️  [Local Dev Email Captured]');
    console.log(`To:      ${Array.isArray(payload.to) ? payload.to.join(', ') : payload.to}`);
    console.log(`From:    ${payload.from}`);
    console.log(`Subject: ${payload.subject}`);
    if (payload.text) {
      console.log(`Text:    ${payload.text}`);
    }
    if (payload.html) {
      const linkMatch = payload.html.match(/href="([^"]+)"/);
      if (linkMatch && linkMatch[1]) {
        console.log(`Action Link: ${linkMatch[1]}`);
      }
    }
    console.log('--------------------------------------------------\n');
    return {
      data: { id: `dev-${Date.now()}` },
      error: null,
    };
  }

  const client = getResendClient();
  try {
    resendEmailSchema.parse(payload);
    const emailResponse = await client.emails.send(payload);
    if (config.isDevelopment) {
      console.log('📧 Email sent successfully:', emailResponse.data?.id);
    }
    return emailResponse;
  } catch (error) {
    if (config?.isDevelopment) {
      console.error('❌ Failed to send email:', error);
    }
    throw new Error(
      `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
};
