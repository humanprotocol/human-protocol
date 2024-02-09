export const gatewayConfigServiceMock = {
  getConfig: jest.fn().mockReturnValue({
    url: 'https://expample.com',
    endpoints: {
      WORKER_SIGNUP: {
        endpoint: '/auth/signup',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      OPERATOR_SIGNUP: {
        endpoint: '/auth/web3/signup',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
    },
  }),
};
