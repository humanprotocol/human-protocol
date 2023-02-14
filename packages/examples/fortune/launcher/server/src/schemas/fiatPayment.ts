export const fiatPayment = {
  type: 'object',
  properties: {
    amount: { type: 'number' },
    currency: { type: 'string' },
    paymentMethodType: { type: 'string' },
    paymentMethodOptions: {
      type: 'object',
    },
  },
  required: ['amount', 'currency'],
};
