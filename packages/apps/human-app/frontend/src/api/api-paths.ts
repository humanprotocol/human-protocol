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
      path: '/auth/reset-link',
    },
    resetPassword: {
      path: '/auth/reset-password',
    },
    verifyEmail: {
      path: '/email-confirmation/email-verification',
    },
    resendEmailVerification: {
      path: '/email-confirmation/resend-email-verification',
    },
  },
} as const;
