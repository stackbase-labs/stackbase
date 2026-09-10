import { APP_TITLE } from '../branding';
import {
  EmailButton,
  EmailContainer,
  EmailDivider,
  EmailHeader,
  EmailHeading,
  EmailLayout,
  EmailText,
} from '../components';
import { WelcomeEmailProps } from '../types';

export const WelcomeTemplate = ({ name, getStartedUrl }: WelcomeEmailProps) => {
  const preview = `Welcome to ${APP_TITLE}, ${name}!`;
  return (
    <EmailLayout preview={preview}>
      <EmailContainer>
        <EmailHeader />
        <EmailHeading>Welcome, {name}!</EmailHeading>
        <EmailText variant="greeting">Hi {name},</EmailText>
        <EmailText>
          Thank you for joining us! We're excited to have you on board. Build Elevate is designed to
          help you streamline your development workflow with powerful tools and integrations.
        </EmailText>
        <EmailText>Here's what you can do now:</EmailText>
        <EmailText>• Get started with our interactive setup guide</EmailText>
        <EmailText>• Explore our comprehensive documentation</EmailText>
        <EmailText>• Connect your first project</EmailText>
        <EmailText>• Invite your team members</EmailText>
        <EmailButton href={getStartedUrl}>Get Started</EmailButton>
        <EmailDivider />
        <EmailText variant="secondary">
          If you have any questions, check out our documentation or reach out to our support team.
        </EmailText>
        <EmailText variant="footer">
          Best regards,
          <br />
          The Build Elevate Team
        </EmailText>
      </EmailContainer>
    </EmailLayout>
  );
};

WelcomeTemplate.PreviewProps = {
  name: 'John Doe',
  getStartedUrl: 'https://example.com/get-started',
} as WelcomeEmailProps;

export default WelcomeTemplate;
