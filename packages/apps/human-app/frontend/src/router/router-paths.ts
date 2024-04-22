export const routerPaths = {
  homePage: '/',
  playground: '/playground',
  worker: {
    signIn: '/worker/sign-in',
    signUp: '/worker/sign-up',
    resetPassword: '/worker/reset-password/:token',
    resetPasswordSuccess: '/worker/reset-password-success',
    sendResetLink: '/worker/send-reset-link',
    sendResetLinkSuccess: '/worker/send-reset-link-success',
    emailVerification: '/verify',
    sendEmailVerification: '/worker/send-email-verification',
  },
  operator: {
    signIn: '/operator/sign-in',
    signUp: '/operator/sign-up',
  },
} as const;
