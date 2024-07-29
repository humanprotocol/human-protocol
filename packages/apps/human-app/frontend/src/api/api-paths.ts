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
    resignJob: {
      path: '/assignment/resign-job',
    },
    registerAddress: {
      path: '/user/register-address',
    },
    signedAddress: {
      path: '/kyc/on-chain',
    },
    enableHCaptchaLabeling: '/labeling/h-captcha/enable',
    verifyHCaptchaLabeling: '/labeling/h-captcha/verify',
    hCaptchaUserStats: '/labeling/h-captcha/user-stats',
    dailyHmtSpend: '/labeling/h-captcha/daily-hmt-spent',
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
    },
  },
} as const;
