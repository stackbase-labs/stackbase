# @workspace/analytics

Client and server event tracking and feature flag evaluation powered by **PostHog**.

## Features

- **Dual Client & Server Entrypoints**: Import browser helpers from `@workspace/analytics/client` and Node/API helpers from `@workspace/analytics/server`.
- **Feature Flags**: Evaluate boolean and multivariate feature flags on both server and client with safe fallback defaults.
- **Zero-Config Local Development**: Automatically no-ops when `POSTHOG_API_KEY` or `NEXT_PUBLIC_POSTHOG_KEY` is omitted.
- **Environment Validation**: Zod-validated environment schema via `@t3-oss/env-nextjs`.

## Usage

### Server (`@workspace/analytics/server`)

```typescript
import {
  captureServerEvent,
  isFeatureEnabled,
  shutdownAnalytics,
} from '@workspace/analytics/server';

captureServerEvent({
  distinctId: 'user_123',
  event: 'invoice_paid',
  properties: { amountCents: 4900 },
});

const useNewPipeline = await isFeatureEnabled('v2-pipeline', 'user_123', {
  defaultValue: false,
});

await shutdownAnalytics();
```

### Client (`@workspace/analytics/client`)

```typescript
import {
  captureClientEvent,
  initPostHogClient,
  isClientFeatureEnabled,
} from '@workspace/analytics/client';

initPostHogClient();
captureClientEvent('upgrade_button_clicked', { source: 'sidebar' });

if (isClientFeatureEnabled('new-pricing-modal')) {
  // render new modal
}
```
