import { ChainId } from '@human-protocol/sdk';
import { CHAIN_ICONS } from '../components/Icons/chains';
import { DollarSignIcon } from '../components/Icons/DollarSignIcon';

export const JOB_STATUS = [
  'launched',
  'pending',
  'completed',
  'cancelled',
  'failed',
];

export const SUPPORTED_CHAIN_IDS = [
  ChainId.MAINNET,
  ChainId.RINKEBY,
  ChainId.GOERLI,
  ChainId.BSC_MAINNET,
  ChainId.BSC_TESTNET,
  ChainId.POLYGON,
  ChainId.POLYGON_MUMBAI,
  ChainId.SKALE,
  ChainId.MOONBEAM,
  ChainId.MOONBASE_ALPHA,
  ChainId.AVALANCHE_TESTNET,
  ChainId.AVALANCHE,
];

export const SUPPORTED_TOKENS = [
  {
    symbol: 'HMT',
    address: '0x106538cc16f938776c7c180186975bca23875287',
    icon: CHAIN_ICONS[ChainId.ALL],
  },
  { symbol: 'ETH', address: '0x', icon: CHAIN_ICONS[ChainId.MAINNET] },
  { symbol: 'MATIC', address: '0x', icon: CHAIN_ICONS[ChainId.POLYGON] },
  { symbol: 'BNB', address: '0x', icon: CHAIN_ICONS[ChainId.BSC_MAINNET] },
  { symbol: 'USDC', address: '0x', icon: <DollarSignIcon /> },
];

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
};

export const LOCAL_STORAGE_KEYS = {
  accessToken: 'HUMAN_JOB_LAUNCHER_ACCESS_TOKEN',
  refreshToken: 'HUMAN_JOB_LAUNCHER_REFRESH_TOKEN',
  accessTokenExpiresAt: 'HUMAN_JOB_LAUNCHER_ACCESS_TOKEN_EXPIRES_AT',
  refreshTokenExpiresAt: 'HUMAN_JOB_LAUNCHER_REFRESH_TOKEN_EXPIRES_AT',
};
