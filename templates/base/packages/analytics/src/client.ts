import posthog, { type PostHog } from 'posthog-js';
import { isConfiguredPostHogKey, keys } from './keys';
import type { PostHogClientConfig } from './types';

let clientInitialized = false;

export const initPostHogClient = (config?: PostHogClientConfig): PostHog | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const env = keys();
  const apiKey = config?.apiKey ?? env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!isConfiguredPostHogKey(apiKey)) {
    return null;
  }

  if (!clientInitialized) {
    posthog.init(apiKey, {
      api_host: config?.host ?? env.NEXT_PUBLIC_POSTHOG_HOST,
      capture_pageview: config?.capturePageview ?? false,
      capture_pageleave: config?.capturePageleave ?? true,
      person_profiles: 'identified_only',
    });
    clientInitialized = true;
  }

  return posthog;
};

export const captureClientEvent = (
  eventName: string,
  properties?: Record<string, unknown>,
  client?: Pick<PostHog, 'capture'> | null,
): boolean => {
  const target = client !== undefined ? client : clientInitialized ? posthog : null;
  if (!target) {
    return false;
  }

  target.capture(eventName, properties);
  return true;
};

export const identifyClientUser = (
  distinctId: string,
  properties?: Record<string, unknown>,
  client?: Pick<PostHog, 'identify'> | null,
): boolean => {
  const target = client !== undefined ? client : clientInitialized ? posthog : null;
  if (!target) {
    return false;
  }

  target.identify(distinctId, properties);
  return true;
};

export const resetClientAnalytics = (client?: Pick<PostHog, 'reset'> | null): void => {
  const target = client !== undefined ? client : clientInitialized ? posthog : null;
  target?.reset();
};

export const isClientFeatureEnabled = (
  flagKey: string,
  defaultValue = false,
  client?: Pick<PostHog, 'isFeatureEnabled'> | null,
): boolean => {
  const target = client !== undefined ? client : clientInitialized ? posthog : null;
  if (!target) {
    return defaultValue;
  }

  return target.isFeatureEnabled(flagKey) ?? defaultValue;
};

export const getClientFeatureFlag = (
  flagKey: string,
  client?: Pick<PostHog, 'getFeatureFlag'> | null,
): string | boolean | undefined => {
  const target = client !== undefined ? client : clientInitialized ? posthog : null;
  if (!target) {
    return undefined;
  }

  return target.getFeatureFlag(flagKey);
};
