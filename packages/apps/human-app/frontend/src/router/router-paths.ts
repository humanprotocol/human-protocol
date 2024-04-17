export const routerPaths = {
  homePage: '/',
  playground: '/playground',
  worker: {
    signIn: '/worker/sign-in',
    signUp: '/worker/sign-up',
  },
  operator: {
    signIn: '/operator/sign-in',
    signUp: '/operator/sign-up',
  },
  resetPassword: '/reset-password',
} as const;
