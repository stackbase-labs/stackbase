import {
  EmailButton,
  EmailContainer,
  EmailDivider,
  EmailHeader,
  EmailHeading,
  EmailLayout,
  EmailLink,
  EmailText,
} from '../components';
import { ChangeEmailProps } from '../types';

export const ChangeEmailTemplate = ({
  name,
  currentEmail,
  newEmail,
  verificationUrl,
}: ChangeEmailProps) => {
  return (
    <EmailLayout preview="Confirm your new email">
      <EmailContainer>
        <EmailHeader />
        <EmailHeading>Confirm your new email</EmailHeading>
        <EmailText variant="greeting">Hi {name},</EmailText>
        <EmailText>
          You asked to change your sign-in email from <strong>{currentEmail}</strong> to{' '}
          <strong>{newEmail}</strong>.
        </EmailText>
        <EmailText>Confirm this update within 24 hours to keep your account secure.</EmailText>
        <EmailButton href={verificationUrl}>Verify email change</EmailButton>
        <EmailText variant="secondary">
          If the button doesn&apos;t work, paste this one-time link into your browser:
          <br />
          <EmailLink href={verificationUrl}>{verificationUrl}</EmailLink>
        </EmailText>
        <EmailDivider />
        <EmailText variant="footer">
          Didn&apos;t request this change? Keep using your current email and disregard this message.
          If you suspect someone else is trying to access your account, reply to this email and
          we&apos;ll help secure it.
        </EmailText>
      </EmailContainer>
    </EmailLayout>
  );
};

ChangeEmailTemplate.PreviewProps = {
  name: 'Example User',
  currentEmail: 'current@example.com',
  newEmail: 'new@example.com',
  verificationUrl: 'https://example.com/verify?token=abc123',
} as ChangeEmailProps;

export default ChangeEmailTemplate;
