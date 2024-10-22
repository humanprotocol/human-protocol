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
    userRegistration: {
      path: '/registration',
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
