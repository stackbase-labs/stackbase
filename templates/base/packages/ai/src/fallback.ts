import { generateText, streamText, type LanguageModel } from 'ai';
import { getDefaultModelSpecs, getLanguageModel } from './providers';
import type { FallbackAttemptError, FallbackOptions, FallbackResult, ModelOrSpec } from './types';

export const isRetryableProviderError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return true;
  }

  if ('isRetryable' in error && typeof error.isRetryable === 'boolean') {
    return error.isRetryable;
  }

  const status =
    'statusCode' in error && typeof error.statusCode === 'number'
      ? error.statusCode
      : 'status' in error && typeof error.status === 'number'
        ? error.status
        : undefined;

  if (status !== undefined) {
    return status === 408 || status === 429 || status >= 500;
  }

  return true;
};

export const withFallback = async <TResult>(
  models: ModelOrSpec[],
  operation: (model: LanguageModel, index: number) => Promise<TResult>,
  options?: FallbackOptions,
): Promise<FallbackResult<TResult>> => {
  const chain = models.length > 0 ? models : getDefaultModelSpecs();
  if (chain.length === 0) {
    throw new Error('No AI models provided for fallback execution');
  }

  const shouldFallback = options?.shouldFallback ?? isRetryableProviderError;
  const failedAttempts: FallbackAttemptError[] = [];

  for (let i = 0; i < chain.length; i++) {
    const item = chain[i];
    if (!item) continue;

    try {
      const model = getLanguageModel(item);
      const result = await operation(model, i);
      return {
        result,
        modelIndex: i,
        failedAttempts,
      };
    } catch (error) {
      failedAttempts.push({ index: i, error });
      const hasNext = i < chain.length - 1;
      if (!hasNext || !shouldFallback(error, i)) {
        throw error;
      }
      options?.onFallback?.(error, i, i + 1);
    }
  }

  const lastFailure = failedAttempts[failedAttempts.length - 1];
  throw lastFailure?.error ?? new Error('All AI fallback models failed');
};

type GenerateTextCallOptions = Parameters<typeof generateText>[0];
type StreamTextCallOptions = Parameters<typeof streamText>[0];

export type GenerateTextParams = Omit<GenerateTextCallOptions, 'model'> & {
  models?: ModelOrSpec[];
  fallbackOptions?: FallbackOptions;
};

export const generateTextWithFallback = async (params: GenerateTextParams) => {
  const { models, fallbackOptions, ...rest } = params;
  return withFallback(
    models ?? getDefaultModelSpecs(),
    (model) =>
      generateText({
        ...rest,
        model,
      } as GenerateTextCallOptions),
    fallbackOptions,
  );
};

export type StreamTextParams = Omit<StreamTextCallOptions, 'model'> & {
  models?: ModelOrSpec[];
  fallbackOptions?: FallbackOptions;
};

export const streamTextWithFallback = async (params: StreamTextParams) => {
  const { models, fallbackOptions, ...rest } = params;
  return withFallback(
    models ?? getDefaultModelSpecs(),
    (model) =>
      Promise.resolve(
        streamText({
          ...rest,
          model,
        } as StreamTextCallOptions),
      ),
    fallbackOptions,
  );
};
