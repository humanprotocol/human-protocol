import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import Ajv from 'ajv';
import Stripe from 'stripe';

const ConfigSchema = Type.Strict(
  Type.Object({
    STRIPE_PUBLISHABLE_KEY: Type.String(),
    STRIPE_SECRET_KEY: Type.String(),
    STRIPE_WEBHOOK_SECRET: Type.String(),
  })
);

const ajv = new Ajv({
  allErrors: true,
  removeAdditional: true,
  useDefaults: true,
  coerceTypes: true,
  allowUnionTypes: true,
});

class StripeClient {
  private stripeClient: Stripe;
  private secretKey = process.env.STRIPE_SECRET_KEY as string;
  private endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
  public publishableKey = process.env.STRIPE_PUBLISHABLE_KEY as string;
  constructor() {
    this.stripeClient = new Stripe(this.secretKey, {
      apiVersion: '2022-11-15',
      appInfo: {
        // For sample support and debugging, not required for production:
        name: 'Fortune Launcher Server',
        version: '1.0.0',
        url: 'https://github.com/humanprotocol/human-protocol/tree/main/packages/examples/fortune/launcher/server',
      },
    });
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    paymentMethodType: string,
    paymentMethodOptions: Stripe.PaymentIntentCreateParams.PaymentMethodOptions
  ) {
    const params: Stripe.PaymentIntentCreateParams = {
      payment_method_types: [paymentMethodType],
      amount: amount,
      currency: currency,
    };

    // If this is for an ACSS payment, we add payment_method_options to create
    // the Mandate.
    if (paymentMethodType === 'acss_debit') {
      params.payment_method_options = {
        acss_debit: {
          mandate_options: {
            payment_schedule: 'sporadic',
            transaction_type: 'personal',
          },
        },
      };
    } else if (paymentMethodType === 'konbini') {
      /**
       * Default value of the payment_method_options
       */
      params.payment_method_options = {
        konbini: {
          product_description: 'Tシャツ',
          expires_after_days: 3,
        },
      };
    } else if (paymentMethodType === 'customer_balance') {
      params.payment_method_data = {
        type: 'customer_balance',
      };
      params.confirm = true;
      params.customer = await this.stripeClient.customers
        .create()
        .then((data) => data.id);
    }

    /**
     * If API given this data, we can overwride it
     */
    if (paymentMethodOptions) {
      params.payment_method_options = paymentMethodOptions;
    }
    // Create a PaymentIntent with the amount, currency, and a payment method type.
    //
    // See the documentation [0] for the full list of supported parameters.
    //
    // [0] https://stripe.com/docs/api/payment_intents/create
    const paymentIntent = await this.stripeClient.paymentIntents.create(params);

    // Send publishable key and PaymentIntent details to client
    return {
      clientSecret: paymentIntent.client_secret,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }

  async webhookHandler(body: string, signature: string) {
    const event = this.stripeClient.webhooks.constructEvent(
      body,
      signature,
      this.endpointSecret
    );
    return event;
  }

  async getPayment(paymentId: string) {
    return this.stripeClient.paymentIntents.retrieve(paymentId);
  }
}

const stripePlugin: FastifyPluginAsync = async (server) => {
  const validate = ajv.compile(ConfigSchema);
  const valid = validate(process.env);
  if (!valid) {
    throw new Error(
      '.env file validation failed - ' +
        JSON.stringify(validate.errors, null, 2)
    );
  }
  server.decorate('stripe', new StripeClient());
};

declare module 'fastify' {
  interface FastifyInstance {
    stripe: StripeClient;
  }
}

export default fp(stripePlugin);
