'use client';

import useIsMounted from '@/hooks/useIsMounted';
import { cn, cva } from '@workspace/ui/lib/utils';
import { useTheme } from 'next-themes';
import { type ComponentProps } from 'react';
import { themes } from './themes';

const itemVariants = cva('size-6.5 p-1.5 text-muted-foreground', {
  variants: {
    active: {
      true: 'bg-accent text-accent-foreground',
      false: 'text-muted-foreground',
    },
  },
});

export interface ThemeSwitchProps extends ComponentProps<'div'> {
  mode?: 'light-dark' | 'light-dark-system';
}

export function ThemeSwitch({ className, mode = 'light-dark-system', ...props }: ThemeSwitchProps) {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const isMounted = useIsMounted();

  const container = cn(
    'inline-flex items-center rounded-full border p-1 overflow-hidden *:rounded-full',
    className,
  );

  if (mode === 'light-dark') {
    const value = isMounted ? resolvedTheme : null;

    return (
      <button
        className={container}
        aria-label={`Toggle Theme`}
        onClick={() => setTheme(value === 'light' ? 'dark' : 'light')}
        data-theme-toggle=""
      >
        {themes.map(({ key, Icon }) => {
          if (key === 'system') return;

          return (
            <Icon
              key={key}
              fill="currentColor"
              className={cn(itemVariants({ active: value === key }))}
            />
          );
        })}
      </button>
    );
  }

  const value = isMounted ? theme : null;

  return (
    <div className={container} data-theme-toggle="" {...props}>
      {themes.map(({ key, Icon }) => (
        <button
          key={key}
          aria-label={key}
          className={cn(itemVariants({ active: value === key }))}
          onClick={() => setTheme(key)}
        >
          <Icon className="size-full" />
        </button>
      ))}
    </div>
  );
}

export default ThemeSwitch;
