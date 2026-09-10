import { AuthForm } from '@/components/auth/auth-form';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const replaceMock = vi.fn();
const authStateMock = vi.fn();
const searchParamsMock = vi.fn();

vi.mock('@/hooks/use-auth-user', () => ({
  useAuthUser: () => authStateMock(),
}));

vi.mock('@workspace/ui/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('@workspace/auth/client', () => ({
  signIn: {
    social: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => searchParamsMock(),
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

vi.mock('@/components/ui/logo', () => ({
  Logo: () => <div>Logo</div>,
}));

vi.mock('@/components/auth', () => ({
  SignInForm: () => <div>SignInForm Mock</div>,
  SignUpForm: () => <div>SignUpForm Mock</div>,
}));

describe('AuthForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStateMock.mockReturnValue({ isAuthenticated: false, isLoading: false });
    searchParamsMock.mockReturnValue({
      get: (key: string) => (key === 'callbackUrl' ? '/dashboard?tab=1' : null),
    });
  });

  it('initiates google social sign-in with callback URL', async () => {
    const { signIn } = await import('@workspace/auth/client');
    const user = userEvent.setup();
    render(<AuthForm mode="sign-in" />);

    await user.click(screen.getByRole('button', { name: /sign in with google/i }));

    expect(signIn.social).toHaveBeenCalledWith({
      provider: 'google',
      callbackURL: '/dashboard?tab=1',
    });
  });

  it('renders sign-up mode variant', () => {
    render(<AuthForm mode="sign-up" />);
    expect(screen.getByRole('button', { name: /sign up with google/i })).toBeInTheDocument();
    expect(screen.getByText('SignUpForm Mock')).toBeInTheDocument();
  });

  it('redirects authenticated users away from auth page', async () => {
    authStateMock.mockReturnValue({ isAuthenticated: true, isLoading: false });

    render(<AuthForm mode="sign-in" />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/');
    });
  });
});
