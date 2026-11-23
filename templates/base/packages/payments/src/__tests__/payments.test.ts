import type Stripe from 'stripe';
import { describe, expect, it, vi } from 'vitest';
import {
  createCheckoutSession,
  createCustomerPortalSession,
  dispatchWebhookEvent,
  keys,
  verifyWebhookSignature,
} from '../index';

describe('Payments Module', () => {
  it('loads Stripe environment configuration schema', () => {
    const env = keys();
    expect(env).toHaveProperty('STRIPE_SECRET_KEY');
    expect(env).toHaveProperty('STRIPE_WEBHOOK_SECRET');
    expect(env).toHaveProperty('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
  });

  it('creates a Stripe checkout session using provided client', async () => {
    const createMock = vi.fn().mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/c/pay/cs_test_123',
    });
    const fakeStripe = {
      checkout: {
        sessions: {
          create: createMock,
        },
      },
    } as unknown as Stripe;

    const session = await createCheckoutSession(
      {
        priceId: 'price_pro_monthly',
        successUrl: 'https://app.example.com/billing/success',
        cancelUrl: 'https://app.example.com/billing/cancel',
        customerEmail: 'founder@example.com',
        metadata: { workspaceId: 'ws_1' },
      },
      fakeStripe,
    );

    expect(session).toEqual({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/c/pay/cs_test_123',
    });
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        customer_email: 'founder@example.com',
        line_items: [{ price: 'price_pro_monthly', quantity: 1 }],
      }),
    );
  });

  it('creates a Stripe customer portal session', async () => {
    const createPortalMock = vi.fn().mockResolvedValue({
      url: 'https://billing.stripe.com/p/session/test_123',
    });
    const fakeStripe = {
      billingPortal: {
        sessions: {
          create: createPortalMock,
        },
      },
    } as unknown as Stripe;

    const portal = await createCustomerPortalSession(
      {
        customerId: 'cus_123',
        returnUrl: 'https://app.example.com/settings/billing',
      },
      fakeStripe,
    );

    expect(portal).toEqual({
      url: 'https://billing.stripe.com/p/session/test_123',
    });
  });

  it('verifies a Stripe webhook signature via constructEvent', () => {
    const constructEventMock = vi.fn().mockReturnValue({
      id: 'evt_123',
      type: 'customer.subscription.updated',
      data: {
        object: { id: 'sub_123', status: 'active' },
      },
    });
    const fakeStripe = {
      webhooks: {
        constructEvent: constructEventMock,
      },
    } as unknown as Stripe;

    const event = verifyWebhookSignature(
      '{"id":"evt_123"}',
      't=123,v1=abc',
      'whsec_test',
      fakeStripe,
    );

    expect(event.id).toBe('evt_123');
    expect(event.type).toBe('customer.subscription.updated');
    expect(event.data).toEqual({ id: 'sub_123', status: 'active' });
  });

  it('dispatches webhook events to matching handlers', async () => {
    const handled: string[] = [];
    const fakeRawEvent = { id: 'evt_1' } as unknown as Stripe.Event;
    const fakeSubObj = { customer: 'cus_1' } as unknown as Stripe.Event['data']['object'];

    const matched = await dispatchWebhookEvent(
      {
        id: 'evt_1',
        type: 'checkout.session.completed',
        data: fakeSubObj,
        raw: fakeRawEvent,
      },
      {
        'checkout.session.completed': (evt) => {
          handled.push(evt.id);
        },
      },
    );

    expect(matched).toBe(true);
    expect(handled).toEqual(['evt_1']);

    const unmatched = await dispatchWebhookEvent(
      {
        id: 'evt_2',
        type: 'invoice.paid',
        data: fakeSubObj,
        raw: fakeRawEvent,
      },
      {},
    );
    expect(unmatched).toBe(false);
  });
});
