import { JwtUserData } from '../../../common/utils/jwt-token.model';
import {
  VerifyTokenApiResponse,
  VerifyTokenCommand,
  VerifyTokenParams,
  VerifyTokenDto,
} from '../model/verify-token.model';
import {
  DailyHmtSpentCommand,
  DailyHmtSpentResponse,
} from '../model/daily-hmt-spent.model';
import {
  BalanceStats,
  UserStatsApiResponse,
  UserStatsCommand,
  UserStatsResponse,
} from '../model/user-stats.model';
import {
  EnableLabelingCommand,
  EnableLabelingResponse,
} from '../model/enable-labeling.model';
const STATUS = 'active';
const EMAIL = 'some_email@example.com';
const ID = 'jwt_token_id';
const H_CAPTCHA_SITE_KEY = 'some_h_captcha_site_key';
const TOKEN_TO_VERIFY = 'some_hcaptcha_token';
const REPUTATION_NETWORK = 'some_reputation_network_address';
const POLYGON_WALLET_ADDR = '0xAf6E2cB084314Fbe50228e697d2B1b8553DDEd25';
const DAILY_HMT_SPENT = 100;
const SOLVED = 10;
const SERVED = 20;
const VERIFIED = 5;
const BALANCE = {
  available: 2,
  estimated: 1,
  recent: 3,
  total: 7,
} as BalanceStats;
export const JWT_TOKEN = 'jwt.token.1';
export const DROPOFF_DATA_1 = {
  '2024-07-02': {
    billing_units: 68,
    bypass: 0,
    served: 68,
    solved: 60,
  },
};
export const DROPOFF_DATA_2 = {
  '2024-07-03': {
    billing_units: 35,
    bypass: 0,
    served: 35,
    solved: 34,
  },
};
export const DROPOFF_DATA_3 = {
  '2024-07-04': {
    billing_units: 45,
    bypass: 0,
    served: 45,
    solved: 42,
  },
};
const EARNINGS_DATA_1 = {
  '2024-07-02': 0.2,
};
const EARNINGS_DATA_2 = {
  '2024-07-03': 0.1,
};
const SUCCESSFULLY_ENABLED = 'Enabled labeling for this account successfully';
export const jwtUserDataFixture: JwtUserData = {
  user_id: ID,
  wallet_address: POLYGON_WALLET_ADDR,
  email: EMAIL,
  status: STATUS,
  qualifications: [],
  site_key: H_CAPTCHA_SITE_KEY,
  reputation_network: REPUTATION_NETWORK,
};

export const hCaptchaUserStatsCommandFixture: UserStatsCommand = {
  email: EMAIL,
  siteKey: H_CAPTCHA_SITE_KEY,
};

export const enableLabelingCommandFixture: EnableLabelingCommand = {
  token: JWT_TOKEN,
};

export const verifyTokenDtoFixture: VerifyTokenDto = {
  token: TOKEN_TO_VERIFY,
};

export const verifyTokenCommandFixture: VerifyTokenCommand = {
  response: TOKEN_TO_VERIFY,
  sitekey: H_CAPTCHA_SITE_KEY,
  secret: POLYGON_WALLET_ADDR,
  jwtToken: JWT_TOKEN,
};

export const verifyTokenParamsFixture: VerifyTokenParams = {
  secret: POLYGON_WALLET_ADDR,
  sitekey: H_CAPTCHA_SITE_KEY,
  response: TOKEN_TO_VERIFY,
};

export const dailyHmtSpentCommandFixture: DailyHmtSpentCommand = {
  siteKey: H_CAPTCHA_SITE_KEY,
};

export const successfulVerifyTokenApiResponseFixture: VerifyTokenApiResponse = {
  success: true,
};

export const unsuccessfulVerifyTokenApiResponseWithErrorCodesFixture: VerifyTokenApiResponse =
  {
    success: false,
    'error-codes': ['invalid-input-response', 'timeout-or-duplicate'],
  };

export const unsuccessfulVerifyTokenApiResponseWithoutErrorCodesFixture: VerifyTokenApiResponse =
  {
    success: false,
  };

export const unsuccessfulVerifyTokenApiResponseWithUndefinedErrorCodesFixture: VerifyTokenApiResponse =
  {
    success: false,
    'error-codes': undefined,
  };

export const dailyHmtSpentResponseFixture: DailyHmtSpentResponse = {
  spend: DAILY_HMT_SPENT,
};

export const errorMessagesFixture = {
  withErrorCodes:
    'Failed to verify h-captcha token. Error: invalid-input-response,timeout-or-duplicate',
  withoutErrorCodes:
    'Failed to verify h-captcha token. "error-codes" array is undefined. Response data: {}',
  withUndefinedErrorCodes:
    'Failed to verify h-captcha token. "error-codes" array is undefined. Response data: {"success":false}',
};
export const dropoffDataFixture = {
  ...DROPOFF_DATA_1,
  ...DROPOFF_DATA_2,
  ...DROPOFF_DATA_3,
};
export const earningsDataFixture = { ...EARNINGS_DATA_1, ...EARNINGS_DATA_2 };

export const userStatsApiResponseFixture: UserStatsApiResponse = {
  solved: SOLVED,
  served: SERVED,
  verified: VERIFIED,
  balance: BALANCE,
  dropoff_data: dropoffDataFixture,
  earnings_data: earningsDataFixture,
};

export const userStatsResponseFixture: UserStatsResponse = {
  solved: SOLVED,
  served: SERVED,
  verified: VERIFIED,
  balance: BALANCE,
  currentDateStats: DROPOFF_DATA_3['2024-07-04'],
  currentEarningsStats: EARNINGS_DATA_2['2024-07-03'],
};

export const userStatsCommandFixture: UserStatsCommand = {
  email: EMAIL,
  siteKey: H_CAPTCHA_SITE_KEY,
};

export const enableLabelingResponseFixture: EnableLabelingResponse = {
  message: SUCCESSFULLY_ENABLED,
};
