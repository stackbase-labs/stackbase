# @workspace/payments

Billing, checkout sessions, customer portal links, and webhook signature verification powered by **Stripe**.

## Features

- **Checkout & Customer Portal**: Type-safe helpers for subscription and one-time Stripe Checkout sessions and Billing Portal links.
- **Webhook Verification**: Raw body signature validation via `stripe.webhooks.constructEvent` and typed event routing.
- **Environment Validation**: Zod-validated environment schema via `@t3-oss/env-nextjs`.

## Usage

```typescript
import {
  createCheckoutSession,
  createCustomerPortalSession,
  dispatchWebhookEvent,
  verifyWebhookSignature,
} from '@workspace/payments';

// 1. Create a checkout session
const checkout = await createCheckoutSession({
  priceId: 'price_123',
  customerEmail: 'user@example.com',
  successUrl: 'https://app.example.com/billing?success=true',
  cancelUrl: 'https://app.example.com/billing?canceled=true',
});

// 2. Generate a customer portal link
const portal = await createCustomerPortalSession({
  customerId: 'cus_123',
  returnUrl: 'https://app.example.com/settings/billing',
});

// 3. Verify and dispatch a webhook event
const event = verifyWebhookSignature(rawBodyBuffer, signatureHeader);
await dispatchWebhookEvent(event, {
  'checkout.session.completed': async (evt) => {
    console.log('Checkout completed:', evt.id);
  },
});
```
