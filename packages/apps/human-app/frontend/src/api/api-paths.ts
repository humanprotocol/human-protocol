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
  },
} as const;
