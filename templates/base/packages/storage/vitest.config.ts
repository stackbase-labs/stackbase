import nodePreset from '@workspace/vitest-presets/node';
import { mergeConfig } from 'vitest/config';

export default mergeConfig(nodePreset, {
  test: {
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['dist/**', 'node_modules/**', '.turbo/**'],
  },
});
