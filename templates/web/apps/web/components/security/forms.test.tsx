import { DeleteAccountForm } from '@/components/security/delete-account-form';
import { PasswordForm } from '@/components/security/password-form';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const useHasPasswordMock = vi.fn();
const pushMock = vi.fn();
const mutateMock = vi.fn();

vi.mock('@/hooks/use-has-password', () => ({
  useHasPassword: () => useHasPasswordMock(),
}));

vi.mock('@tanstack/react-query', async () => {
  const actual =
    await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');

  return {
    ...actual,
    useMutation: () => ({
      mutate: mutateMock,
      isPending: false,
    }),
  };
});

vi.mock('@workspace/auth/client', () => ({
  changePassword: vi.fn(),
  deleteUser: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
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

describe('Security Forms (PasswordForm, DeleteAccountForm)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders set password mode when user has no password', () => {
    useHasPasswordMock.mockReturnValue({ data: false, isLoading: false });

    render(<PasswordForm />);

    expect(screen.getByRole('button', { name: /set password/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/current password/i)).not.toBeInTheDocument();
  });

  it('renders change password mode when user has password', () => {
    useHasPasswordMock.mockReturnValue({ data: true, isLoading: false });

    render(<PasswordForm />);

    expect(screen.getByRole('button', { name: /change password/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter current password/i)).toBeInTheDocument();
  });

  it('shows password required warning for delete account when password is missing', () => {
    useHasPasswordMock.mockReturnValue({ data: false, isLoading: false });

    render(<DeleteAccountForm />);

    expect(screen.getByText(/password required/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete account/i })).toBeDisabled();
  });

  it('opens delete dialog when user has password', async () => {
    const user = userEvent.setup();
    useHasPasswordMock.mockReturnValue({ data: true, isLoading: false });

    render(<DeleteAccountForm />);
    await user.click(screen.getByRole('button', { name: /delete account/i }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/this action cannot be undone/i)).toBeInTheDocument();
  });
});
