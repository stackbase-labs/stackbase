import { ReactNode } from 'react';
import { Text } from 'react-email';

interface EmailTextProps {
  children: ReactNode;
  variant?: 'greeting' | 'body' | 'secondary' | 'footer';
}

const variantStyles = {
  greeting: 'mt-3 text-[15px] leading-[24px] text-[#111827]',
  body: 'mt-2 text-[15px] leading-[24px] text-[#1f2937]',
  secondary: 'mt-6 text-[14px] leading-[22px] text-[#374151]',
  footer: 'text-[12px] leading-[20px] text-[#6b7280]',
};

export const EmailText = ({ children, variant = 'body' }: EmailTextProps) => {
  return <Text className={variantStyles[variant]}>{children}</Text>;
};
