export const apiPaths = {
  test: {
    path: '/test',
  },
  worker: {
    signIn: {
      path: '/auth/signin',
      withAuthRetry: true,
    },
    signUp: {
      path: '/auth/signup',
      withAuthRetry: true,
    },
    obtainAccessToken: {
      path: '/auth/refresh',
      withAuthRetry: true,
    },
    sendResetLink: {
      path: '/password-reset/forgot-password',
      withAuthRetry: true,
    },
    resetPassword: {
      path: '/password-reset/restore-password',
      withAuthRetry: true,
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
        withAuthRetry: true,
      },
      signUp: {
        path: '/auth/web3/signup',
        withAuthRetry: true,
      },
      signIn: {
        path: '/auth/web3/signin',
        withAuthRetry: true,
      },
      stats: {
        path: '/stats',
      },
    },
    disableOperator: {
      path: '/disable-operator',
    },
  },
} as const;
