export const apiPaths = {
  hcaptchaGeneralStats: {
    path: '/stats/hcaptcha/general',
  },
  generalStats: {
    path: '/stats/general',
  },
  statsHmtPrice: {
    path: '/stats/hmt-price',
  },
  hmtDailyStats: {
    path: '/stats/hmt/daily',
  },
  hcaptchaStatsDaily: {
    path: '/stats/hcaptcha/daily',
  },
  leaderboardDetails: {
    path: '/details/operators',
  },
  addressDetails: {
    path: '/details',
  },
  transactionDetails: {
    path: '/details/transactions',
  },
  escrowDetails: {
    path: '/details/escrows',
  },
  enabledChains: {
    path: '/networks/operating',
  },
} as const;
