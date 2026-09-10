import { SignInForm } from '@/components/auth/sign-in-form';
import { SignUpForm } from '@/components/auth/sign-up-form';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const signInMutateMock = vi.fn();
const signUpMutateMock = vi.fn();

vi.mock('@/hooks/auth/use-sign-in', () => ({
  useSignIn: () => ({ mutate: signInMutateMock, isPending: false }),
}));

vi.mock('@/hooks/auth/use-sign-up', () => ({
  useSignUp: () => ({ mutate: signUpMutateMock, isPending: false }),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === 'callbackUrl' ? '/dashboard' : null),
  }),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('Auth Forms (SignInForm, SignUpForm)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits sign-in form values', async () => {
    const user = userEvent.setup();
    render(<SignInForm />);

    await user.type(screen.getByPlaceholderText(/yourname@example.com/i), 'vijay@example.com');
    await user.type(screen.getByPlaceholderText(/minimum 8 characters/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(signInMutateMock).toHaveBeenCalledWith({
      email: 'vijay@example.com',
      password: 'password123',
    });
  });

  it('submits sign-up form values', async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);

    await user.type(screen.getByPlaceholderText(/e.g. your name/i), 'Vijay');
    await user.type(screen.getByPlaceholderText(/yourname@example.com/i), 'vijay@example.com');
    await user.type(screen.getByPlaceholderText(/minimum 8 characters/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(signUpMutateMock).toHaveBeenCalledWith({
      name: 'Vijay',
      email: 'vijay@example.com',
      password: 'password123',
    });
  });
});
