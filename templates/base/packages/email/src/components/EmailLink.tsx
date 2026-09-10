import { ReactNode } from 'react';
import { Link } from 'react-email';

interface EmailLinkProps {
  href: string;
  children: ReactNode;
}

export const EmailLink = ({ href, children }: EmailLinkProps) => {
  return (
    <Link href={href} className="text-[13px] break-all text-[#0f172a] underline">
      {children}
    </Link>
  );
};
