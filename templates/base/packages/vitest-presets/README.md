# @workspace/vitest-presets

This package provides shared Vitest configuration presets for the monorepo, including:

- Web preset for React applications (`jsdom` + `@vitejs/plugin-react`)
- Node preset for server and library packages (`node` test environment)
- Common test and coverage defaults

## Package Structure

```txt
packages/vitest-presets/
├── node/
│   └── vitest.config.mjs
├── web/
│   └── vitest.config.mjs
├── package.json
├── eslint.config.js
└── README.md
```

## Usage

Import and merge the preset in your package `vitest.config.ts`:

```ts
import webPreset from '@workspace/vitest-presets/web';
import path from 'path';
import { mergeConfig } from 'vitest/config';

export default mergeConfig(webPreset, {
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

For Node packages:

```ts
import nodePreset from '@workspace/vitest-presets/node';
import { mergeConfig } from 'vitest/config';

export default mergeConfig(nodePreset, {
  // package-specific overrides
});
```

## Features

- Shared exports: `@workspace/vitest-presets/web` and `@workspace/vitest-presets/node`
- Standardized include/exclude patterns for tests
- Built-in V8 coverage with `text`, `json`, and `html` reporters
- Global test APIs enabled (`globals: true`)

## Setup

1. Use `@workspace/vitest-presets/web` in browser-based apps.
2. Use `@workspace/vitest-presets/node` in Node/server packages.
3. For web apps, add a local `vitest.setup.ts` file because the web preset includes `setupFiles: ["./vitest.setup.ts"]`.
4. Add package-specific aliases or overrides with `mergeConfig`.

## Example

```ts
import webPreset from '@workspace/vitest-presets/web';
import { mergeConfig } from 'vitest/config';

export default mergeConfig(webPreset, {
  test: {
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});
```
