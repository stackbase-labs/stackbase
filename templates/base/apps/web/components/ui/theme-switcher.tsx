'use client';

import useIsMounted from '@/hooks/useIsMounted';
import { Button } from '@workspace/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { useSidebar } from '@workspace/ui/components/sidebar';
import { LaptopIcon, MoonIcon, SunIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { themes } from './themes';

export function ThemeSwitcher() {
  const isMounted = useIsMounted();
  const { theme, setTheme } = useTheme();
  const { state } = useSidebar();

  const isSidebarExpanded = state === 'expanded';
  if (!isMounted) return null;

  const currentIcon =
    theme === 'light' ? (
      <SunIcon className="h-4 w-4" />
    ) : theme === 'dark' ? (
      <MoonIcon className="h-4 w-4" />
    ) : (
      <LaptopIcon className="h-4 w-4" />
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className={isSidebarExpanded ? '' : 'self-center'}>
        <Button
          variant={'ghost'}
          size={isSidebarExpanded ? 'sm' : 'icon'}
          aria-label="Select theme"
          className="border"
        >
          {currentIcon} {isSidebarExpanded ? <span className="capitalize">{theme}</span> : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
          {themes.map(({ key, label, Icon }) => (
            <DropdownMenuRadioItem key={key} value={key}>
              <div className="flex items-center">
                <Icon className="mr-2 h-4 w-4" />
                <span>{label}</span>
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ThemeSwitcher;
