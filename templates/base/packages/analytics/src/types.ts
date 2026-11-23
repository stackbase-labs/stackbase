export interface PostHogServerConfig {
  apiKey?: string;
  host?: string;
  flushAt?: number;
  flushInterval?: number;
}

export interface PostHogClientConfig {
  apiKey?: string;
  host?: string;
  capturePageview?: boolean;
  capturePageleave?: boolean;
}

export interface ServerAnalyticsEvent {
  distinctId: string;
  event: string;
  properties?: Record<string, unknown>;
  groups?: Record<string, string | number>;
}

export interface FeatureFlagOptions {
  groups?: Record<string, string>;
  personProperties?: Record<string, string>;
  groupProperties?: Record<string, Record<string, string>>;
  defaultValue?: boolean;
}
