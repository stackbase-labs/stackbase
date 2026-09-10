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
import { VerificationEmailProps } from '../types';

export const VerificationEmail = ({ name, verificationUrl }: VerificationEmailProps) => {
  return (
    <EmailLayout preview="Confirm your email">
      <EmailContainer>
        <EmailHeader />
        <EmailHeading>Confirm your email</EmailHeading>
        <EmailText variant="greeting">Hi {name},</EmailText>
        <EmailText>
          Please confirm this email address to finish setting up your account. This keeps your
          security alerts and notifications pointed to the right inbox.
        </EmailText>
        <EmailButton href={verificationUrl}>Confirm email</EmailButton>
        <EmailText variant="secondary">
          If the button doesn&apos;t work, paste this one-time link into your browser:
          <br />
          <EmailLink href={verificationUrl}>{verificationUrl}</EmailLink>
        </EmailText>
        <EmailDivider />
        <EmailText variant="footer">
          If you didn&apos;t create an account, you can ignore this email.
        </EmailText>
      </EmailContainer>
    </EmailLayout>
  );
};

VerificationEmail.PreviewProps = {
  name: 'Example User',
  verificationUrl: 'https://example.com/verify?token=abc123',
} as VerificationEmailProps;

export default VerificationEmail;
