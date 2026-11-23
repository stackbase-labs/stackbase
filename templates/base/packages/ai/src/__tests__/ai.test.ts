import type { LanguageModel } from 'ai';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  defineTool,
  type GenerateTextParams,
  isRetryableProviderError,
  keys,
  withFallback,
} from '../index';

const createFakeModel = (id: string): LanguageModel =>
  ({
    specificationVersion: 'v1',
    provider: 'test',
    modelId: id,
  }) as unknown as LanguageModel;

describe('AI Module', () => {
  it('reads default AI provider and model settings from keys', () => {
    const env = keys();
    expect(env.AI_DEFAULT_PROVIDER).toBe('openai');
    expect(env.OPENAI_MODEL).toBe('gpt-6-luna');
    expect(env.ANTHROPIC_MODEL).toBe('claude-sonnet-5-5');
  });

  it('identifies retryable rate-limit and 5xx errors', () => {
    expect(isRetryableProviderError({ statusCode: 429 })).toBe(true);
    expect(isRetryableProviderError({ statusCode: 503 })).toBe(true);
    expect(isRetryableProviderError({ statusCode: 400 })).toBe(false);
    expect(isRetryableProviderError({ statusCode: 401 })).toBe(false);
  });

  it('falls back to secondary model when primary model fails with retryable error', async () => {
    const primary = createFakeModel('gpt-6-luna');
    const secondary = createFakeModel('claude-sonnet-5-5');
    const onFallback = vi.fn();

    const response = await withFallback(
      [primary, secondary],
      async (model, index) => {
        if (index === 0) {
          throw Object.assign(new Error('Rate limit exceeded'), { statusCode: 429 });
        }
        return `Success from ${String((model as unknown as { modelId: string }).modelId)}`;
      },
      { onFallback },
    );

    expect(response.result).toBe('Success from claude-sonnet-5-5');
    expect(response.modelIndex).toBe(1);
    expect(response.failedAttempts).toHaveLength(1);
    expect(onFallback).toHaveBeenCalledTimes(1);
  });

  it('does not fall back on non-retryable 400 error', async () => {
    const primary = createFakeModel('gpt-6-luna');
    const secondary = createFakeModel('claude-sonnet-5-5');
    const op = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error('Bad request'), { statusCode: 400 }));

    await expect(withFallback([primary, secondary], op)).rejects.toThrow('Bad request');
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('validates tool inputs with Zod before executing tool handler', async () => {
    const weatherTool = defineTool({
      description: 'Fetch weather forecast for a city',
      inputSchema: z.object({
        city: z.string().min(1),
        unit: z.enum(['celsius', 'fahrenheit']).default('celsius'),
      }),
      execute: ({ city, unit }) => ({
        city,
        temperature: unit === 'celsius' ? 22 : 72,
        unit,
      }),
    });

    const output = await weatherTool.execute({ city: 'Bengaluru', unit: 'celsius' });
    expect(output).toEqual({
      city: 'Bengaluru',
      temperature: 22,
      unit: 'celsius',
    });

    await expect(weatherTool.execute({ city: '', unit: 'celsius' })).rejects.toThrow();

    const paramsWithTools: GenerateTextParams = {
      models: [
        { provider: 'openai', modelId: 'gpt-6-luna' },
        { provider: 'anthropic', modelId: 'claude-sonnet-5-5' },
      ],
      tools: { weatherTool },
      prompt: 'Check weather in Bengaluru.',
    };
    expect(paramsWithTools.tools).toHaveProperty('weatherTool');
  });
});
