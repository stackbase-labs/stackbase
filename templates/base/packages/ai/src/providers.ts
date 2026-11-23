import { createAnthropic, type AnthropicProvider } from '@ai-sdk/anthropic';
import { createOpenAI, type OpenAIProvider } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';
import { keys } from './keys';
import type { AIProviderName, ModelOrSpec, ModelSpec } from './types';

const openaiProviders = new Map<string, OpenAIProvider>();
const anthropicProviders = new Map<string, AnthropicProvider>();

const getOpenAIProvider = (apiKey: string): OpenAIProvider => {
  const cached = openaiProviders.get(apiKey);
  if (cached) {
    return cached;
  }
  const created = createOpenAI({ apiKey });
  openaiProviders.set(apiKey, created);
  return created;
};

const getAnthropicProvider = (apiKey: string): AnthropicProvider => {
  const cached = anthropicProviders.get(apiKey);
  if (cached) {
    return cached;
  }
  const created = createAnthropic({ apiKey });
  anthropicProviders.set(apiKey, created);
  return created;
};

const isModelSpec = (value: ModelOrSpec): value is ModelSpec => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'provider' in value &&
    (value.provider === 'openai' || value.provider === 'anthropic') &&
    !('specificationVersion' in value)
  );
};

export const getLanguageModel = (spec?: ModelOrSpec): LanguageModel => {
  const modelSpec = spec && isModelSpec(spec) ? spec : undefined;
  if (spec !== undefined && !modelSpec) {
    return spec as LanguageModel;
  }

  const env = keys();
  const provider: AIProviderName = modelSpec?.provider ?? env.AI_DEFAULT_PROVIDER;

  if (provider === 'anthropic') {
    const apiKey = modelSpec?.apiKey ?? env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }
    return getAnthropicProvider(apiKey)(modelSpec?.modelId ?? env.ANTHROPIC_MODEL);
  }

  const apiKey = modelSpec?.apiKey ?? env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return getOpenAIProvider(apiKey)(modelSpec?.modelId ?? env.OPENAI_MODEL);
};

export const getDefaultModelSpecs = (): ModelSpec[] => {
  const env = keys();
  const primary: ModelSpec =
    env.AI_DEFAULT_PROVIDER === 'anthropic'
      ? { provider: 'anthropic', modelId: env.ANTHROPIC_MODEL }
      : { provider: 'openai', modelId: env.OPENAI_MODEL };

  const secondary: ModelSpec =
    primary.provider === 'openai'
      ? { provider: 'anthropic', modelId: env.ANTHROPIC_MODEL }
      : { provider: 'openai', modelId: env.OPENAI_MODEL };

  const chain: ModelSpec[] = [primary];

  const hasSecondaryKey =
    secondary.provider === 'anthropic'
      ? Boolean(env.ANTHROPIC_API_KEY)
      : Boolean(env.OPENAI_API_KEY);

  if (hasSecondaryKey) {
    chain.push(secondary);
  }

  return chain;
};
