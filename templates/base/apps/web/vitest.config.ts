import webPreset from '@workspace/vitest-presets/web';
import path from 'path';
import { mergeConfig } from 'vitest/config';

export default mergeConfig(webPreset, {
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/components': path.resolve(__dirname, './components'),
      '@/hooks': path.resolve(__dirname, './hooks'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/config': path.resolve(__dirname, './config'),
    },
  },
});
