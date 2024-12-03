export const gatewayConfigServiceMock = {
  getConfig: jest.fn().mockReturnValue({
    url: 'https://example.com',
    endpoints: {
      worker_signup: {
        endpoint: '/auth/signup',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      operator_signup: {
        endpoint: '/auth/web3/signup',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      worker_signin: {
        endpoint: '/auth/signin',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      registration_in_exchange_oracle: {
        endpoint: '/user/exchange-oracle-registration',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      email_verification: {
        endpoint: '/auth/email-verification',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      resend_email_verification: {
        endpoint: '/auth/resend-email-verification',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      forgot_password: {
        endpoint: '/auth/forgot-password',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      restore_password: {
        endpoint: '/auth/restore-password',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      prepare_signature: {
        endpoint: '/user/prepare-signature',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      disable_operator: {
        endpoint: '/user/disable-operator',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      kyc_procedure_start: {
        endpoint: '/kyc/start',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      enable_labeling: {
        endpoint: '/labeler/register',
        method: 'POST',
        params: { api_key: 'mock-api-key' },
      },
      operator_signin: {
        endpoint: '/auth/web3/signin',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        params: {},
      },
      register_address: {
        endpoint: '/user/register-address',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      token_refresh: {
        endpoint: '/auth/refresh',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
    },
  }),
};

export const hCaptchaGatewayConfigServiceMock = {
  getConfig: jest.fn().mockReturnValue({
    url: 'https://api.example.com',
    endpoints: {
      TOKEN_VERIFY: {
        method: 'POST',
        endpoint: '/siteverify',
        headers: {},
        params: {},
      },
      DAILY_HMT_SPENT: {
        method: 'GET',
        endpoint: '/requester/daily_hmt_spend',
        headers: {},
        params: { api_key: 'mock-api-key', actual: false },
      },
      USER_STATS: {
        method: 'GET',
        endpoint: '/support/labeler/',
        headers: {},
        params: { api_key: 'mock-api-key' },
      },
    },
  }),
};
