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
      path: 'auth/send',
    },
  },
} as const;
