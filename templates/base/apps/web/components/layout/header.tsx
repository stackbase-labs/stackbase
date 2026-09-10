'use client';

import { Logo } from '@/components/ui/logo';
import ThemeSwitch from '@/components/ui/theme-switch';
import { Separator } from '@workspace/ui/components/separator';
import { SidebarTrigger } from '@workspace/ui/components/sidebar';
import Link from 'next/link';

function Header() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
      <div className="flex items-center justify-between gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <Link href="/">
          <Logo variant="text-only" classes={{ text: '' }} />
        </Link>
      </div>
      <div>
        <ThemeSwitch />
      </div>
    </header>
  );
}

export default Header;
