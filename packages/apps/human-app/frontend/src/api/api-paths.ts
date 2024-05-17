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
  },
} as const;
