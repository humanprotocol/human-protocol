export enum ReputationOracleEndpoints {
  WORKER_SIGNUP = 'worker_signup',
  WORKER_SIGNIN = 'worker_signin',
  OPERATOR_SIGNUP = 'operator_signup',
  OPERATOR_SIGNIN = 'operator_signin',
  M2M_SIGNIN = 'm2m_signin',
  EMAIL_VERIFICATION = 'email_verification',
  RESEND_EMAIL_VERIFICATION = 'resend_email_verification',
  FORGOT_PASSWORD = 'forgot_password',
  RESTORE_PASSWORD = 'restore_password',
  PREPARE_SIGNATURE = 'prepare_signature',
  DISABLE_OPERATOR = 'disable_operator',
  ENABLE_OPERATOR = 'enable_operator',
  KYC_PROCEDURE_START = 'kyc_procedure_start',
  ENABLE_LABELING = 'enable_labeling',
  REGISTER_ADDRESS = 'register_address',
  TOKEN_REFRESH = 'token_refresh',
  KYC_ON_CHAIN = 'kyc_on_chain',
  REGISTRATION_IN_EXCHANGE_ORACLE = 'registration_in_exchange_oracle',
  GET_REGISTRATION_IN_EXCHANGE_ORACLES = 'get_registration_in_exchange_oracles',
  GET_LATEST_NDA = 'get_latest_nda',
  SIGN_NDA = 'sign_nda',
  REPORT_ABUSE = 'report_abuse',
  GET_ABUSE_REPORTS = 'get_abuse_reports',
}
export enum HCaptchaLabelingStatsEndpoints {
  USER_STATS = 'user_stats',
  DAILY_HMT_SPENT = 'daily_hmt_spent',
}
export enum HCaptchaLabelingVerifyEndpoints {
  TOKEN_VERIFY = 'token_verify',
}
