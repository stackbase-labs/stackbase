# @workspace/ai

Vercel AI SDK integration with multi-provider routing, automatic fallback chains, and Zod-validated tool definitions.

## Features

- **Multi-Provider Support**: First-class OpenAI (`@ai-sdk/openai`) and Anthropic (`@ai-sdk/anthropic`) model factories.
- **Automatic Fallbacks**: Retries text generation and streaming across fallback models on rate limits (`429`), timeouts (`408`), and upstream `5xx` errors.
- **Typed Tool Calling**: `defineTool` validates tool arguments with Zod schemas before execution.
- **Environment Validation**: Zod-validated environment schema via `@t3-oss/env-nextjs`.

## Usage

```typescript
import { defineTool, generateTextWithFallback } from '@workspace/ai';
import { z } from 'zod';

const lookupOrder = defineTool({
  description: 'Look up order status by order ID',
  inputSchema: z.object({
    orderId: z.string(),
  }),
  execute: async ({ orderId }) => ({
    orderId,
    status: 'shipped',
  }),
});

const { result, modelIndex } = await generateTextWithFallback({
  models: [
    { provider: 'openai', modelId: 'gpt-6-luna' },
    { provider: 'anthropic', modelId: 'claude-sonnet-5-5' },
  ],
  tools: { lookupOrder },
  prompt: 'Check the shipping status for order ORD-1042.',
});
```
