import { ReactNode } from 'react';
import { Text } from 'react-email';
import { APP_TITLE } from '../branding';

interface EmailHeaderProps {
  label?: string;
  children?: ReactNode;
}

export const EmailHeader = ({ label = 'Security update' }: EmailHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <Text className="rounded-full bg-[#0f172a] px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-white uppercase">
        {APP_TITLE}
      </Text>
      <Text className="text-[12px] font-medium text-[#6b7280]">{label}</Text>
    </div>
  );
};
