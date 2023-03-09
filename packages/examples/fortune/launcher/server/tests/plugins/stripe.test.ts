import { describe, test, expect, vi } from 'vitest';
import getServer from '../../src/server';

vi.mock('stripe', () => {
  return {
    default: vi.fn(() => ({
      paymentIntents: {
        create: vi.fn(() =>
          Promise.resolve({
            client_secret: 'client_secret',
          })
        ),
      },
    })),
  };
});

describe('Stripe tests', async () => {
  const server = await getServer();
  const { stripe } = server;

  test('Should create a payment intent', async () => {
    const paymentInten = await stripe.createPaymentIntent(
      10,
      'usd',
      'card',
      {}
    );
    expect(paymentInten.clientSecret).eq('client_secret');
  });
});
