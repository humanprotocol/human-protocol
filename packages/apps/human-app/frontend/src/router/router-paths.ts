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
    connectWallet: '/operator/connect-wallet',
    addStake: '/operator/add-stake',
  },
  resetPassword: '/reset-password',
} as const;
