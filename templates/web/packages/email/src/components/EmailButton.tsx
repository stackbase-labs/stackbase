import { Button } from 'react-email';

interface EmailButtonProps {
  href: string;
  children: string;
}

export const EmailButton = ({ href, children }: EmailButtonProps) => {
  return (
    <div className="mt-7 text-center">
      <Button
        href={href}
        className="inline-block rounded-xl bg-[#0f172a] px-7 py-3 text-center text-[15px] font-semibold text-white no-underline shadow-md"
      >
        {children}
      </Button>
    </div>
  );
};
