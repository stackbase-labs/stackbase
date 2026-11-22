# @workspace/queue

Production-ready background job queues and distributed worker pipelines powered by **BullMQ** and **Redis**.

## Features

- **BullMQ Client & Worker Factories**: Type-safe queue creation and worker event hooks.
- **Graceful Shutdown**: Automatically closes queues and workers on `SIGTERM` / `SIGINT`.
- **Environment Validation**: Zod-validated environment schema via `@t3-oss/env-nextjs`.

## Usage

```typescript
import { createQueue, createWorker } from '@workspace/queue';

interface EmailJobData {
  to: string;
  subject: string;
}

// 1. Create a queue
export const emailQueue = createQueue<EmailJobData>('email-delivery');

// 2. Add a job
await emailQueue.add('welcome-email', {
  to: 'user@example.com',
  subject: 'Welcome to Stackbase!',
});

// 3. Create a worker
export const emailWorker = createWorker<EmailJobData>('email-delivery', async (job) => {
  console.log(`Processing email for ${job.data.to}`);
});
```
