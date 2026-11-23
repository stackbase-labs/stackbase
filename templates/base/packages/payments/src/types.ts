import type Stripe from 'stripe';

export type CheckoutMode = 'subscription' | 'payment';

export interface CreateCheckoutParams {
  priceId: string;
  successUrl: string;
  cancelUrl?: string;
  customerId?: string;
  customerEmail?: string;
  mode?: CheckoutMode;
  quantity?: number;
  metadata?: Record<string, string>;
}

export interface CheckoutSessionResult {
  id: string;
  url: string;
}

export interface CreatePortalParams {
  customerId: string;
  returnUrl?: string;
}

export interface CustomerPortalResult {
  url: string;
}

export interface WebhookEvent<TData = Stripe.Event['data']['object']> {
  id: string;
  type: Stripe.Event.Type | (string & {});
  data: TData;
  raw: Stripe.Event;
}

export type WebhookHandler<TData = Stripe.Event['data']['object']> = (
  event: WebhookEvent<TData>,
) => Promise<void> | void;

export type WebhookHandlerMap = Record<string, WebhookHandler>;
