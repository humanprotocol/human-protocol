export const SUPPORTED_TOKEN_SYMBOLS = ['HMT'];

export const ERROR_MESSAGES = {
  weakPassword:
    'Password must contain at least 1 uppercase, 1 lowercase, 1 numeric and 1 special character',
  invalidPasswordLength: 'Password must be at least 8 characters',
  invalidPasswordMaxLength: 'Password must be less than 256 characters',
  invalidWalletAddress: 'Invalid Wallet Address',
  invalidLengthWalletAddress: 'Wallet Address length must be 42',
  invalidEmail: 'Invalid Email',
  duplicatedEmail: 'Email is already used',
  requirePassword: 'Password required',
  requireEmail: 'Email required',
  requireUserName: 'User name required',
  requireWalletAddress: 'Polygon Wallet Address required',
  requireVerificationToken: 'Verification token required',
  invalidVerificationToken: 'Invalid verification token',
  captchaPassRequired: 'You need to solve captcha',
  requireCountry: 'Country required',
  notConfirmedPassword: 'Passwords should be same',
  requireRestPasswordToken: 'Verification token required',
  requireAuthToken: 'Authentication token required',
  requireProfileDetails: 'Profile details required',
  sactionListError:
    'The app is not available in your location. Please refer to our T&Cs',
  tcRequired: 'The terms and conditions should be accepted',
  noRpcUrl:
    'No valid RPC URL provided for the supported blockchain environment',
};

export const LOCAL_STORAGE_KEYS = {
  accessToken: 'HUMAN_JOB_LAUNCHER_ACCESS_TOKEN',
  refreshToken: 'HUMAN_JOB_LAUNCHER_REFRESH_TOKEN',
};
