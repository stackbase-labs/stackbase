import nodePreset from '@workspace/vitest-presets/node';
import { mergeConfig } from 'vitest/config';

export default mergeConfig(nodePreset, {
  test: {
    setupFiles: ['./src/__tests__/setup/env.ts'],
  },
});
