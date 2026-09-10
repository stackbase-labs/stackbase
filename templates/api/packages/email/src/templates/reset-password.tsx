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
import { ResetPasswordProps } from '../types';

export const ResetPasswordTemplate = ({ name, resetUrl }: ResetPasswordProps) => {
  return (
    <EmailLayout preview="Reset your password">
      <EmailContainer>
        <EmailHeader />
        <EmailHeading>Reset your password</EmailHeading>
        <EmailText variant="greeting">Hi {name},</EmailText>
        <EmailText>
          We received a request to reset your password. If this wasn&apos;t you, you can safely
          ignore this email.
        </EmailText>
        <EmailText>
          Click the button below to create a new password. This link expires in 1 hour to keep your
          account secure.
        </EmailText>
        <EmailButton href={resetUrl}>Reset password</EmailButton>
        <EmailText variant="secondary">
          If the button doesn&apos;t work, paste this one-time link into your browser:
          <br />
          <EmailLink href={resetUrl}>{resetUrl}</EmailLink>
        </EmailText>
        <EmailDivider />
        <EmailText variant="footer">
          Keep this email private—anyone with the link can change your password. Need help? Reply to
          this message and we&apos;ll be in touch.
        </EmailText>
      </EmailContainer>
    </EmailLayout>
  );
};

ResetPasswordTemplate.PreviewProps = {
  name: 'Example User',
  resetUrl: 'https://example.com/reset-password?token=abc123',
} as ResetPasswordProps;

export default ResetPasswordTemplate;
