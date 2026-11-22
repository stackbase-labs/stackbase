import { Queue, Worker, type Processor, type QueueOptions, type WorkerOptions } from 'bullmq';
import { Redis } from 'ioredis';
import { keys } from './keys';
import type { ConnectionOptions, RedisConfig } from './types';

const activeQueues = new Set<Queue>();
const activeWorkers = new Set<Worker>();

export const getRedisConnection = (customConfig?: RedisConfig): ConnectionOptions => {
  const env = keys();

  if (customConfig?.url || env.REDIS_URL) {
    const redisUrl = customConfig?.url || env.REDIS_URL;
    if (redisUrl) {
      return new Redis(redisUrl, { maxRetriesPerRequest: null }) as unknown as ConnectionOptions;
    }
  }

  return {
    host: customConfig?.host ?? env.REDIS_HOST,
    port: customConfig?.port ?? env.REDIS_PORT,
    password: customConfig?.password ?? env.REDIS_PASSWORD ?? undefined,
    maxRetriesPerRequest: null,
  };
};

export const createQueue = <Data = unknown, Result = unknown>(
  name: string,
  options?: Partial<QueueOptions>,
): Queue<Data, Result> => {
  const connection = options?.connection ?? getRedisConnection();
  const queue = new Queue<Data, Result>(name, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: 1000,
      removeOnFail: 5000,
      ...options?.defaultJobOptions,
    },
    ...options,
  });

  activeQueues.add(queue as unknown as Queue);
  return queue;
};

export const createWorker = <Data = unknown, Result = unknown>(
  name: string,
  processor: Processor<Data, Result>,
  options?: Partial<WorkerOptions>,
): Worker<Data, Result> => {
  const connection = options?.connection ?? getRedisConnection();
  const worker = new Worker<Data, Result>(name, processor, {
    connection,
    ...options,
  });

  activeWorkers.add(worker as unknown as Worker);
  return worker;
};

export const closeAll = async (): Promise<void> => {
  const workers = Array.from(activeWorkers);
  const queues = Array.from(activeQueues);

  activeWorkers.clear();
  activeQueues.clear();

  await Promise.all([
    ...workers.map((worker) => worker.close()),
    ...queues.map((queue) => queue.close()),
  ]);
};
