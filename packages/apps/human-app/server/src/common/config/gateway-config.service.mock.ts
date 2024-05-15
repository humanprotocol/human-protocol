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
      WORKER_SIGNIN: {
        endpoint: '/auth/signin',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      EMAIL_VERIFICATION: {
        endpoint: '/auth/email-verification',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      RESEND_EMAIL_VERIFICATION: {
        endpoint: '/auth/resend-email-verification',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      FORGOT_PASSWORD: {
        endpoint: '/auth/forgot-password',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      RESTORE_PASSWORD: {
        endpoint: '/auth/restore-password',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      PREPARE_SIGNATURE: {
        endpoint: '/user/prepare-signature',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      DISABLE_OPERATOR: {
        endpoint: '/user/disable-operator',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      KYC_PROCEDURE_START: {
        endpoint: '/kyc/start',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
    },
  }),
};
