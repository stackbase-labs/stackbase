'use client';

import { config } from '@/config/site';
import { useSidebar } from '@workspace/ui/components/sidebar';
import { cn } from '@workspace/ui/lib/utils';
import { Layers } from 'lucide-react';

type LogoProps = {
  variant: 'default' | 'home' | 'sidebar' | 'notFound' | 'error' | 'text-only';
  classes?: {
    container?: string;
    logo?: string;
    icon?: string;
    text?: string;
  };
};

export function Logo({ variant, classes }: LogoProps) {
  const { state } = useSidebar();
  const defaults = getDefaults(variant);
  const showLogo = variant !== 'text-only';
  const showText =
    ['default', 'text-only', 'home'].includes(variant) ||
    (variant === 'sidebar' && state === 'expanded');

  return (
    <div className={cn(defaults.container, classes?.container ?? '')}>
      {showLogo ? (
        <div className={cn(defaults.logo, classes?.logo ?? '')}>
          <Layers className={cn(defaults.icon, classes?.icon ?? '')} />
        </div>
      ) : null}
      {showText && <span className={cn(defaults.text, classes?.text ?? '')}>{config.name}</span>}
    </div>
  );
}

function getDefaults(variant: LogoProps['variant']) {
  const containerBaseClass = 'flex items-center gap-2';
  const logoBaseClass =
    'flex aspect-square size-7 items-center justify-center rounded-lg bg-sidebar-primary text-white';
  const iconBaseClass = 'size-5';
  const textBaseClass = 'text-xl font-medium tracking-tight';

  switch (variant) {
    case 'sidebar':
      return {
        container: cn(containerBaseClass),
        logo: cn(logoBaseClass),
        icon: cn(iconBaseClass),
        text: cn(textBaseClass, '!text-xl'),
      };
    case 'home':
    case 'error':
    case 'notFound':
      return {
        container: cn(containerBaseClass),
        logo: cn(logoBaseClass, 'size-16'),
        icon: cn(iconBaseClass, 'size-8'),
        text: cn(textBaseClass),
      };
    case 'text-only':
      return {
        container: cn(containerBaseClass),
        logo: '',
        icon: '',
        text: cn(textBaseClass, 'text-lg sm:text-xl font-medium'),
      };
    default:
      return {
        container: cn(containerBaseClass),
        logo: cn(logoBaseClass),
        icon: cn(iconBaseClass),
        text: cn(textBaseClass),
      };
  }
}
