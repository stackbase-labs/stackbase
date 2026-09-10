import { AppSidebar } from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const useAuthUserMock = vi.fn();
const useSidebarMock = vi.fn();

vi.mock('@/hooks/use-auth-user', () => ({
  useAuthUser: () => useAuthUserMock(),
}));

vi.mock('@/components/layout/nav-user', () => ({
  NavUser: () => <div>NavUser Mock</div>,
}));

vi.mock('@/components/ui/theme-switcher', () => ({
  __esModule: true,
  default: () => <div>Theme Switcher</div>,
}));

vi.mock('@/components/ui/logo', () => ({
  Logo: () => <div>Logo</div>,
}));

vi.mock('@/components/ui/theme-switch', () => ({
  __esModule: true,
  default: () => <div>Theme Switch</div>,
  ThemeSwitch: () => <div>Theme Switch</div>,
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

vi.mock('@/config/site', () => ({
  config: {
    nav: [{ title: 'Dashboard', href: '/dashboard', icon: () => <span>Icon</span> }],
  },
}));

vi.mock('@workspace/ui/components/sidebar', () => ({
  Sidebar: ({ children }: { children: React.ReactNode }) => <aside>{children}</aside>,
  SidebarContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarFooter: ({ children }: { children: React.ReactNode }) => <footer>{children}</footer>,
  SidebarGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarGroupContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarGroupLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarMenuButton: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarMenuItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarRail: () => <div>Rail</div>,
  SidebarTrigger: () => <button type="button">Trigger</button>,
  useSidebar: () => useSidebarMock(),
}));

describe('Layout Components (AppSidebar, Header)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSidebarMock.mockReturnValue({ state: 'expanded', isMobile: true });
  });

  it('shows auth actions in sidebar when user is not authenticated', () => {
    useAuthUserMock.mockReturnValue({ isAuthenticated: false });

    render(<AppSidebar />);

    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.queryByText('NavUser Mock')).not.toBeInTheDocument();
  });

  it('shows nav user when authenticated', () => {
    useAuthUserMock.mockReturnValue({ isAuthenticated: true });

    render(<AppSidebar />);

    expect(screen.getByText('NavUser Mock')).toBeInTheDocument();
  });

  it('renders mobile header when sidebar says mobile', () => {
    render(<Header />);

    expect(screen.getByRole('banner')).toHaveClass('flex');
    expect(screen.getByText('Logo')).toBeInTheDocument();
    expect(screen.getByText('Theme Switch')).toBeInTheDocument();
  });

  it('renders header on desktop state', () => {
    useSidebarMock.mockReturnValue({ state: 'expanded', isMobile: false });
    render(<Header />);

    expect(screen.getByRole('banner')).toHaveClass('flex');
    expect(screen.getByText('Logo')).toBeInTheDocument();
  });
});
