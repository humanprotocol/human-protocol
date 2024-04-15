export const apiPaths = {
  test: {
    path: '/test',
  },
  worker: {
    signIn: {
      path: 'auth/sign-in',
    },
    signUp: {
      path: 'auth/sign-up',
    },
  },
} as const;
