export const routerPaths = {
  homePage: '/',
  playground: '/playground',
  worker: {
    signIn: '/worker/sign-in',
    signUp: '/worker/sign-up',
    resetPassword: '/worker/reset-password/:token',
    sendResetLink: '/worker/send-reset-link',
    sendResetLinkSuccess: '/worker/send-reset-link-success',
  },
  operator: {
    signIn: '/operator/sign-in',
    signUp: '/operator/sign-up',
  },
} as const;
