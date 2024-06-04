export const apiPaths = {
  test: {
    path: '/test',
  },
  worker: {
    signIn: {
      path: '/auth/signin',
    },
    signUp: {
      path: '/auth/signup',
    },
    obtainAccessToken: {
      // TODO add correct path
      path: '/auth/refresh',
    },
    sendResetLink: {
      path: '/password-reset/forgot-password',
    },
    resetPassword: {
      path: '/password-reset/restore-password',
    },
    verifyEmail: {
      path: '/email-confirmation/email-verification',
    },
    resendEmailVerification: {
      path: '/email-confirmation/resend-email-verification',
    },
    kycSessionId: {
      path: '/kyc/start',
    },
    oracles: {
      path: '/oracles',
    },
    jobs: {
      path: '/jobs',
    },
    myJobs: {
      path: '/assignment/job',
    },
    assignJob: {
      path: '/assignment/job',
    },
    registerAddress: {
      path: '/user/register-address',
    },
  },
  operator: {
    web3Auth: {
      prepareSignature: {
        path: '/prepare-signature',
      },
      signUp: {
        path: '/auth/web3/signup',
      },
      signIn: {
        path: '/auth/web3/signin',
      },
    },
    disableOperator: {
      path: '/disable-operator',
    },
  },
} as const;
