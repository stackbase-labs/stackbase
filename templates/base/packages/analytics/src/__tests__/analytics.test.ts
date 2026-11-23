import type { PostHog as PostHogClient } from 'posthog-js';
import type { PostHog as PostHogServer } from 'posthog-node';
import { describe, expect, it, vi } from 'vitest';
import {
  captureClientEvent,
  captureServerEvent,
  getClientFeatureFlag,
  getFeatureFlag,
  getPostHogServer,
  identifyClientUser,
  identifyServerUser,
  isClientFeatureEnabled,
  isFeatureEnabled,
  keys,
  shutdownAnalytics,
} from '../index';

describe('Analytics Module', () => {
  it('provides default PostHog host settings in keys', () => {
    const env = keys();
    expect(env.POSTHOG_HOST).toBe('https://us.i.posthog.com');
    expect(env.NEXT_PUBLIC_POSTHOG_HOST).toBe('https://us.i.posthog.com');
  });

  it('gracefully no-ops server tracking and returns default flag values when unconfigured or using template placeholders', async () => {
    expect(getPostHogServer({ apiKey: 'your-posthog-api-key' })).toBeNull();

    const captured = captureServerEvent(
      {
        distinctId: 'user_1',
        event: 'user_signed_up',
      },
      null,
    );
    expect(captured).toBe(false);

    const flag = await isFeatureEnabled('beta-dashboard', 'user_1', { defaultValue: true }, null);
    expect(flag).toBe(true);
  });

  it('captures server events, identifies users, evaluates flags, and shuts down client', async () => {
    const captureMock = vi.fn();
    const identifyMock = vi.fn();
    const isFeatureEnabledMock = vi.fn().mockResolvedValue(true);
    const getFeatureFlagMock = vi.fn().mockResolvedValue('variant-b');
    const shutdownMock = vi.fn().mockResolvedValue(undefined);

    const fakeServer = {
      capture: captureMock,
      identify: identifyMock,
      isFeatureEnabled: isFeatureEnabledMock,
      getFeatureFlag: getFeatureFlagMock,
      shutdown: shutdownMock,
    } as unknown as PostHogServer;

    expect(
      captureServerEvent(
        {
          distinctId: 'user_42',
          event: 'subscription_upgraded',
          properties: { plan: 'pro' },
        },
        fakeServer,
      ),
    ).toBe(true);
    expect(captureMock).toHaveBeenCalledWith({
      distinctId: 'user_42',
      event: 'subscription_upgraded',
      properties: { plan: 'pro' },
      groups: undefined,
    });

    expect(identifyServerUser('user_42', { email: 'dev@example.com' }, fakeServer)).toBe(true);
    expect(identifyMock).toHaveBeenCalledWith({
      distinctId: 'user_42',
      properties: { email: 'dev@example.com' },
    });

    expect(await isFeatureEnabled('new-checkout', 'user_42', undefined, fakeServer)).toBe(true);
    expect(await getFeatureFlag('checkout-copy', 'user_42', undefined, fakeServer)).toBe(
      'variant-b',
    );

    await shutdownAnalytics(fakeServer);
    expect(shutdownMock).toHaveBeenCalledTimes(1);
  });

  it('captures client events and evaluates client feature flags with provided instance', () => {
    const captureMock = vi.fn();
    const identifyMock = vi.fn();
    const isFeatureEnabledMock = vi.fn().mockReturnValue(true);
    const getFeatureFlagMock = vi.fn().mockReturnValue('treatment');

    const fakeClient = {
      capture: captureMock,
      identify: identifyMock,
      isFeatureEnabled: isFeatureEnabledMock,
      getFeatureFlag: getFeatureFlagMock,
    } as unknown as PostHogClient;

    expect(captureClientEvent('cta_clicked', { location: 'hero' }, fakeClient)).toBe(true);
    expect(captureMock).toHaveBeenCalledWith('cta_clicked', { location: 'hero' });

    expect(identifyClientUser('user_99', { role: 'admin' }, fakeClient)).toBe(true);
    expect(identifyMock).toHaveBeenCalledWith('user_99', { role: 'admin' });

    expect(isClientFeatureEnabled('ai-assistant', false, fakeClient)).toBe(true);
    expect(getClientFeatureFlag('onboarding-flow', fakeClient)).toBe('treatment');
  });
});
