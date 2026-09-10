'use client';

import { NavUser } from '@/components/layout/nav-user';
import { Logo } from '@/components/ui/logo';
import ThemeSwitcher from '@/components/ui/theme-switcher';
import { config } from '@/config/site';
import { useAuthUser } from '@/hooks/use-auth-user';
import { Button } from '@workspace/ui/components/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@workspace/ui/components/sidebar';
import { cn } from '@workspace/ui/lib/utils';
import { LogIn, UserPlus } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar();
  const { isAuthenticated } = useAuthUser();
  const isSidebarExpanded = state === 'expanded';

  return (
    <Sidebar collapsible={config.layout?.sidebarCollapsible ?? 'offcanvas'} {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:p-1.5!">
              <Link href="/">
                <Logo variant="sidebar" />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {config.nav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton tooltip={item.title} asChild>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {isAuthenticated ? (
          <>
            {!config.layout?.showHeader ? <ThemeSwitcher /> : null}
            <NavUser />
          </>
        ) : (
          <div className={cn('flex flex-col gap-2', { 'self-center': !isSidebarExpanded })}>
            {!config.layout?.showHeader ? <ThemeSwitcher /> : null}
            <Button size={isSidebarExpanded ? 'sm' : 'icon'} aria-label="Sign up">
              <Link
                href="/sign-up"
                className={`flex flex-row items-center justify-center ${isSidebarExpanded ? 'space-x-2' : ''}`}
              >
                <UserPlus className="h-4 w-4" />
                <span>{isSidebarExpanded ? 'Sign up' : ''}</span>
              </Link>
            </Button>
            <Button
              variant="secondary"
              size={isSidebarExpanded ? 'sm' : 'icon'}
              aria-label="Sign in"
            >
              <Link
                href="/sign-in"
                className={`flex flex-row items-center justify-center ${isSidebarExpanded ? 'space-x-2' : ''}`}
              >
                <LogIn className="h-4 w-4" />
                <span>{isSidebarExpanded ? 'Sign in' : ''}</span>
              </Link>
            </Button>
          </div>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
