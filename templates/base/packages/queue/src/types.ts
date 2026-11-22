import type { ConnectionOptions, Job, Processor, QueueOptions, WorkerOptions } from 'bullmq';

export interface RedisConfig {
  host?: string;
  port?: number;
  password?: string;
  url?: string;
}

export type { ConnectionOptions, Job, Processor, QueueOptions, WorkerOptions };
