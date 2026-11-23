import { PostHog } from 'posthog-node';
import { isConfiguredPostHogKey, keys } from './keys';
import type { FeatureFlagOptions, PostHogServerConfig, ServerAnalyticsEvent } from './types';

let serverInstance: PostHog | null = null;

export { isConfiguredPostHogKey };

export const getPostHogServer = (config?: PostHogServerConfig): PostHog | null => {
  if (serverInstance && !config?.apiKey) {
    return serverInstance;
  }

  const env = keys();
  const apiKey = config?.apiKey ?? env.POSTHOG_API_KEY ?? env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!isConfiguredPostHogKey(apiKey)) {
    return null;
  }

  const client = new PostHog(apiKey, {
    host: config?.host ?? env.POSTHOG_HOST,
    flushAt: config?.flushAt ?? 20,
    flushInterval: config?.flushInterval ?? 10000,
  });

  if (!config?.apiKey) {
    serverInstance = client;
  }

  return client;
};

export const captureServerEvent = (
  payload: ServerAnalyticsEvent,
  client?: PostHog | null,
): boolean => {
  const posthog = client !== undefined ? client : getPostHogServer();
  if (!posthog) {
    return false;
  }

  posthog.capture({
    distinctId: payload.distinctId,
    event: payload.event,
    properties: payload.properties,
    groups: payload.groups,
  });
  return true;
};

export const identifyServerUser = (
  distinctId: string,
  properties?: Record<string, unknown>,
  client?: PostHog | null,
): boolean => {
  const posthog = client !== undefined ? client : getPostHogServer();
  if (!posthog) {
    return false;
  }

  posthog.identify({
    distinctId,
    properties,
  });
  return true;
};

export const isFeatureEnabled = async (
  flagKey: string,
  distinctId: string,
  options?: FeatureFlagOptions,
  client?: PostHog | null,
): Promise<boolean> => {
  const fallback = options?.defaultValue ?? false;
  const posthog = client !== undefined ? client : getPostHogServer();
  if (!posthog) {
    return fallback;
  }

  try {
    const enabled = await posthog.isFeatureEnabled(flagKey, distinctId, {
      groups: options?.groups,
      personProperties: options?.personProperties,
      groupProperties: options?.groupProperties,
    });
    return enabled ?? fallback;
  } catch {
    return fallback;
  }
};

export const getFeatureFlag = async (
  flagKey: string,
  distinctId: string,
  options?: FeatureFlagOptions,
  client?: PostHog | null,
): Promise<string | boolean | undefined> => {
  const posthog = client !== undefined ? client : getPostHogServer();
  if (!posthog) {
    return options?.defaultValue;
  }

  try {
    const value = await posthog.getFeatureFlag(flagKey, distinctId, {
      groups: options?.groups,
      personProperties: options?.personProperties,
      groupProperties: options?.groupProperties,
    });
    return value ?? options?.defaultValue;
  } catch {
    return options?.defaultValue;
  }
};

export const shutdownAnalytics = async (client?: PostHog | null): Promise<void> => {
  const target = client !== undefined ? client : serverInstance;
  if (!target) {
    return;
  }

  if (target === serverInstance) {
    serverInstance = null;
  }

  await target.shutdown();
};
