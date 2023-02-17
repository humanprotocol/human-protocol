import { Type } from '@sinclair/typebox';
import { FastifyPluginAsync } from 'fastify';
import Stripe from 'stripe';
import { Currency } from '../constants/currencies';
import { fiatPayment as fiatPaymentSchema } from '../schemas/fiatPayment';

export const cryptoPayment: FastifyPluginAsync = async (server) => {
  server.post(
    '/payment',
    {
      schema: {
        body: { type: 'string' },
      },
    },
    async function (request) {
      const txHash = request.body;

      // eslint-disable-next-line no-console
      console.log(txHash);

      return true;
    }
  );
};

export const createFiatPayment: FastifyPluginAsync = async (server) => {
  let fiatData: typeof fiatPaymentSchema.properties;

  server.get(
    '/config',
    {
      schema: {
        response: {
          200: Type.Object({
            response: Type.String(),
          }),
        },
      },
    },
    async function (request, reply) {
      const { stripe } = server;
      try {
        return JSON.stringify({ publishableKey: stripe.publishableKey });
      } catch (e) {
        return reply.status(400).send(e.message);
      }
    }
  );

  server.post(
    '/create-payment-intent',
    {
      preValidation: (request, reply, done) => {
        fiatData = request.body as typeof fiatPaymentSchema.properties;
        const currency = fiatData.currency as unknown as Currency;
        if (Object.values(Currency).includes(currency)) done(undefined);
        else done(new Error('Invalid currency'));
      },
      schema: {
        body: fiatPaymentSchema,
        response: {
          200: Type.Object({
            response: Type.String(),
          }),
        },
      },
    },
    async function (request, reply) {
      const { stripe } = server;
      try {
        return JSON.stringify(
          await stripe.createPaymentIntent(
            Number(fiatData.amount),
            fiatData.currency.toString(),
            fiatData?.paymentMethodType?.toString(),
            fiatData?.paymentMethodOptions as Stripe.PaymentIntentCreateParams.PaymentMethodOptions
          )
        );
      } catch (e) {
        return reply.status(400).send(e.message);
      }
    }
  );
};
