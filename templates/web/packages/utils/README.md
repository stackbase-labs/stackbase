# @workspace/utils

This package provides shared utility functions, and types for the monorepo, including:

- Helper functions for common operations (strings, numbers, dates)
- Shared TypeScript types
- Date formatting powered by [date-fns](https://date-fns.org/)

## Usage

Import and use utilities in your apps:

```ts
import { capitalize, truncate } from '@workspace/utils/helpers';
import type { AuthUser } from '@workspace/utils/types';
```

## Features

- **Helper Functions**: String manipulation, number operations, date formatting
- **Type Definitions**: Shared TypeScript types for consistency across apps
- **Modular Exports**: Import only what you need with granular exports

## Available Exports

### Helpers (`@workspace/utils/helpers`)

- **String helpers**: `capitalize`, `truncate`, `isEmpty`
- **Number helpers**: `clamp`, `round`
- **Date helpers**: `formatDate`, `formatDistanceToNow`, `formatDuration`, `intervalToDuration`

## Example

```ts
import { capitalize, truncate } from '@workspace/utils/helpers';

// String helpers
const title = capitalize('hello world'); // "Hello world"
const short = truncate('Very long text...', 10); // "Very long…"
```
