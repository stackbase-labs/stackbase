import { LaptopIcon, MoonIcon, SunIcon } from 'lucide-react';

export const themes = [
  { key: 'light', label: 'Light', Icon: SunIcon },
  { key: 'dark', label: 'Dark', Icon: MoonIcon },
  { key: 'system', label: 'System', Icon: LaptopIcon },
] as const;
