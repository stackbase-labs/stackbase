import Stripe from 'stripe';
import { keys } from './keys';
import type {
  CheckoutSessionResult,
  CreateCheckoutParams,
  CreatePortalParams,
  CustomerPortalResult,
  WebhookEvent,
  WebhookHandlerMap,
} from './types';

let defaultStripeClient: Stripe | null = null;

export const getStripeClient = (apiKey?: string): Stripe => {
  if (apiKey) {
    return new Stripe(apiKey);
  }

  if (defaultStripeClient) {
    return defaultStripeClient;
  }

  const secretKey = keys().STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  defaultStripeClient = new Stripe(secretKey);
  return defaultStripeClient;
};

export const createStripeCheckoutSession = async (
  params: CreateCheckoutParams,
  client?: Stripe,
): Promise<CheckoutSessionResult> => {
  const stripe = client ?? getStripeClient();
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: params.mode ?? 'subscription',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl ?? params.successUrl,
    line_items: [
      {
        price: params.priceId,
        quantity: params.quantity ?? 1,
      },
    ],
    metadata: params.metadata,
  };

  if (params.customerId) {
    sessionParams.customer = params.customerId;
  } else if (params.customerEmail) {
    sessionParams.customer_email = params.customerEmail;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  if (!session.url) {
    throw new Error('Stripe checkout session did not return a redirect URL');
  }

  return {
    id: session.id,
    url: session.url,
  };
};

export const createStripePortalSession = async (
  params: CreatePortalParams,
  client?: Stripe,
): Promise<CustomerPortalResult> => {
  const stripe = client ?? getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });

  return {
    url: session.url,
  };
};

export const verifyStripeWebhook = (
  payload: string | Buffer,
  signature: string,
  webhookSecret?: string,
  client?: Stripe,
): WebhookEvent => {
  const secret = webhookSecret ?? keys().STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }

  const stripe = client ?? getStripeClient();
  const event = stripe.webhooks.constructEvent(payload, signature, secret);

  return {
    id: event.id,
    type: event.type,
    data: event.data.object,
    raw: event,
  };
};

export const dispatchWebhookEvent = async (
  event: WebhookEvent,
  handlers: WebhookHandlerMap,
): Promise<boolean> => {
  const handler = handlers[event.type];
  if (!handler) {
    return false;
  }
  await handler(event);
  return true;
};
