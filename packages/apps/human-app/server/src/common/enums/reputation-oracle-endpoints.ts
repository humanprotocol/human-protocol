export enum ReputationOracleEndpoints {
  WORKER_SIGNUP = 'WORKER_SIGNUP',
  WORKER_SIGNIN = 'WORKER_SIGNIN',
  WORKER_REGISTRATION = 'WORKER_REGISTRATION',
  OPERATOR_SIGNUP = 'OPERATOR_SIGNUP',
  OPERATOR_SIGNIN = 'OPERATOR_SIGNIN',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  RESEND_EMAIL_VERIFICATION = 'RESEND_EMAIL_VERIFICATION',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  RESTORE_PASSWORD = 'RESTORE_PASSWORD',
  PREPARE_SIGNATURE = 'PREPARE_SIGNATURE',
  DISABLE_OPERATOR = 'DISABLE_OPERATOR',
  KYC_PROCEDURE_START = 'KYC_PROCEDURE_START',
  ENABLE_LABELING = 'ENABLE_LABELING',
  REGISTER_ADDRESS = 'REGISTER_ADDRESS',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  KYC_ON_CHAIN = 'KYC_ON_CHAIN',
}
export enum HCaptchaLabelingStatsEndpoints {
  USER_STATS = 'USER_STATS',
  DAILY_HMT_SPENT = 'DAILY_HMT_SPENT',
}
export enum HCaptchaLabelingVerifyEndpoints {
  TOKEN_VERIFY = 'TOKEN_VERIFY',
}
