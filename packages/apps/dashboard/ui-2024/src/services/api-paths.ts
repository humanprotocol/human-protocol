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
	addressDetails: {
		path: '/details',
	},
	transactionDetails: {
		path: '/details/transactions',
	},
	escrowDetails: {
		path: '/details/escrows',
	},
} as const;
