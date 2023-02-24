export const escrow = {
  type: 'object',
  properties: {
    chainId: { type: 'number' },
    title: { type: 'string' },
    description: { type: 'string' },
    fortunesRequired: { type: 'number' },
    token: { type: 'string', minLength: 2, pattern: '^0x[a-fA-F0-9]{40}$' },
    fundAmount: { type: 'number' },
    jobRequester: {
      type: 'string',
      minLength: 2,
      pattern: '^0x[a-fA-F0-9]{40}$',
    },
    paymentId: { type: 'string' },
    fiat: { type: 'boolean', default: 'false' },
  },
  required: [
    'chainId',
    'title',
    'description',
    'fortunesRequired',
    'token',
    'fundAmount',
    'jobRequester',
  ],
};
