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

/**
 * Custom Email Template - Copy this file as a starting point for new emails
 *
 * Steps to create a custom email:
 * 1. Copy this file and rename it (e.g., notification.tsx)
 * 2. Update the interface name and props
 * 3. Customize the content and styling
 * 4. Add PreviewProps for testing in the email app
 * 5. Export the component
 * 6. Register it in types.ts and constants.ts (if using with sendAuthEmail)
 */

export interface CustomEmailProps {
  name: string;
  actionUrl: string;
  message?: string;
}

export const CustomTemplate = ({
  name,
  actionUrl,
  message = 'Click the button below to take action',
}: CustomEmailProps) => {
  return (
    <EmailLayout preview="Custom email notification">
      <EmailContainer>
        <EmailHeader />
        <EmailHeading>Hello {name}!</EmailHeading>
        <EmailText variant="greeting">Hi {name},</EmailText>
        <EmailText>{message}</EmailText>
        <EmailButton href={actionUrl}>Take Action</EmailButton>
        <EmailText variant="secondary">
          If the button doesn&apos;t work, paste this link into your browser:
          <br />
          <EmailLink href={actionUrl}>{actionUrl}</EmailLink>
        </EmailText>
        <EmailDivider />
        <EmailText variant="footer">
          If you didn&apos;t request this, you can ignore this email.
        </EmailText>
      </EmailContainer>
    </EmailLayout>
  );
};

// Preview props for the email app - customize these to test your template
CustomTemplate.PreviewProps = {
  name: 'Example User',
  actionUrl: 'https://example.com/action',
  message:
    'This is a custom email template. Update this message and the props above to test your design.',
} as CustomEmailProps;

export default CustomTemplate;
