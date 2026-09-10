import { ReactNode } from 'react';
import { Container } from 'react-email';

interface EmailContainerProps {
  children: ReactNode;
}

export const EmailContainer = ({ children }: EmailContainerProps) => {
  return (
    <Container className="mx-auto max-w-xl rounded-2xl bg-white px-8 py-10 shadow-xl ring-1 ring-[#e5e7eb]">
      {children}
    </Container>
  );
};
