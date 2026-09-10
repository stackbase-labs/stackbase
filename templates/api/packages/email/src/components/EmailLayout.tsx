import { ReactNode } from 'react';
import { Body, Head, Html, Preview, Tailwind } from 'react-email';
import { FONT_FAMILY, FontHead } from '../fonts';

interface EmailLayoutProps {
  preview: string;
  children: ReactNode;
}

export const EmailLayout = ({ preview, children }: EmailLayoutProps) => {
  return (
    <Html>
      <Head>
        <FontHead />
      </Head>
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body
          className="mx-auto my-auto bg-[#f7f7fb] px-4 py-8 font-sans"
          style={{ fontFamily: FONT_FAMILY }}
        >
          {children}
        </Body>
      </Tailwind>
    </Html>
  );
};
