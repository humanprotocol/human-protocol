import { describe, test, expect, vi } from 'vitest';
import getServer from '../../src/server';

describe('Stripe tests', async () => {
  const server = await getServer();
  const { stripe } = server;

  test('Should create a payment intent', async () => {
    stripe.createPaymentIntent = vi.fn(async () => ({
      clientSecret: 'client_secret',
    }));

    const paymentIntent = await stripe.createPaymentIntent(
      100,
      'usd',
      'card',
      {}
    );
    expect(paymentIntent.clientSecret).eq('client_secret');
  });
});
