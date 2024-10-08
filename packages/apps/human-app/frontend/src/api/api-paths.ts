export const apiPaths = {
  test: {
    path: '/test',
    withAuthRetry: false,
  },
  worker: {
    signIn: {
      path: '/auth/signin',
      withAuthRetry: false,
    },
    signUp: {
      path: '/auth/signup',
      withAuthRetry: false,
    },
    obtainAccessToken: {
      path: '/auth/refresh',
      withAuthRetry: false,
    },
    sendResetLink: {
      path: '/password-reset/forgot-password',
      withAuthRetry: false,
    },
    resetPassword: {
      path: '/password-reset/restore-password',
      withAuthRetry: false,
    },
    verifyEmail: {
      path: '/email-confirmation/email-verification',
      withAuthRetry: true,
    },
    resendEmailVerification: {
      path: '/email-confirmation/resend-email-verification',
      withAuthRetry: true,
    },
    kycStart: {
      path: '/kyc/start',
      withAuthRetry: true,
    },
    oracles: {
      path: '/oracles',
      withAuthRetry: false,
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
    resignJob: {
      path: '/assignment/resign-job',
    },
    registerAddress: {
      path: '/user/register-address',
      withAuthRetry: true,
    },
    signedAddress: {
      path: '/kyc/on-chain',
      withAuthRetry: true,
    },
    enableHCaptchaLabeling: {
      path: '/labeling/h-captcha/enable',
    },
    verifyHCaptchaLabeling: {
      path: '/labeling/h-captcha/verify',
    },
    hCaptchaUserStats: {
      path: '/labeling/h-captcha/user-stats',
    },
    dailyHmtSpend: {
      path: '/labeling/h-captcha/daily-hmt-spent',
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
      stats: {
        path: '/stats',
      },
    },
    disableOperator: {
      path: '/disable-operator',
      withAuthRetry: true,
    },
  },
} as const;
