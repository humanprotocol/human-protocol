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
    sendResetLink: {
      path: '/auth/reset-link',
    },
    resetPassword: {
      path: '/auth/reset-password',
    },
    verifyEmail: {
      path: '/auth/verify',
    },
  },
} as const;
