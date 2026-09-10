'use client';

import { AppSidebar } from '@/components/layout/app-sidebar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SidebarProvider } from '@workspace/ui/components/sidebar';
import { TooltipProvider } from '@workspace/ui/components/tooltip';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import * as React from 'react';
import { Toaster } from 'sonner';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
    >
      <QueryClientProvider client={queryClient}>
        <SidebarProvider>
          <TooltipProvider>
            <AppSidebar />
            <Toaster richColors />
            {children}
          </TooltipProvider>
        </SidebarProvider>
      </QueryClientProvider>
    </NextThemesProvider>
  );
}
