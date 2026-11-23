import type { LanguageModel } from 'ai';
import type { z } from 'zod';

export type AIProviderName = 'openai' | 'anthropic';

export interface ModelSpec {
  provider: AIProviderName;
  modelId?: string;
  apiKey?: string;
}

export type ModelOrSpec = LanguageModel | ModelSpec;

export interface FallbackAttemptError {
  index: number;
  error: unknown;
}

export interface FallbackOptions {
  shouldFallback?: (error: unknown, attemptIndex: number) => boolean;
  onFallback?: (error: unknown, failedIndex: number, nextIndex: number) => void;
}

export interface FallbackResult<TResult> {
  result: TResult;
  modelIndex: number;
  failedAttempts: FallbackAttemptError[];
}

export interface ToolDefinitionOptions<TInput extends z.ZodType, TOutput> {
  description: string;
  inputSchema: TInput;
  execute: (input: z.infer<TInput>) => Promise<TOutput> | TOutput;
}
