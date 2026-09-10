# UI Components (shadcn/ui)

Shared UI component library built with [shadcn/ui](https://ui.shadcn.com/).

## Usage

Initialize shadcn/ui (if not already set up):

```bash
pnpm dlx shadcn@latest init
```

## Adding Components

To add components to your app, run the following command at the root directory:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

This will place the UI components in the `packages/ui/src/components` directory.

## Tailwind

Your `tailwind.config.ts` and `globals.css` are already set up to use the components from the `ui` package.

## Using Components

To use the components in your app, import them from the `ui` package:

```tsx
import { Button } from '@workspace/ui/components/button';
```

## Available Components

The UI package includes components from shadcn/ui. To see all available components, visit [ui.shadcn.com](https://ui.shadcn.com/).
