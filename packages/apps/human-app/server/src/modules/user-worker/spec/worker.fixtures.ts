import {
  RegistrationInExchangeOracleCommand,
  RegistrationInExchangeOracleData,
  RegistrationInExchangeOracleResponse,
} from '../model/worker-registration.model';

const EXCHANGE_ORACLE_URL = 'https://www.test_url.org';
const ORACLE_ADDRESS = 'test_address';
const TOKEN = 'test-token';
const HCAPTCHA_TOKEN = 'test-token';
const EXCHANGE_ORACLE_ADDRESS = '0x3dfa342';
export const exchangeOracleUrlFixture = EXCHANGE_ORACLE_URL;
export const workerToken = TOKEN;

export const registerWorkerCommandFixture: RegistrationInExchangeOracleCommand =
  {
    oracleAddress: EXCHANGE_ORACLE_ADDRESS,
    hCaptchaToken: HCAPTCHA_TOKEN,
    token: TOKEN,
  };

export const registerWorkerDataFixture: RegistrationInExchangeOracleData = {
  oracle_address: EXCHANGE_ORACLE_ADDRESS,
  h_captcha_token: HCAPTCHA_TOKEN,
};

export const responseWorkerFixture: RegistrationInExchangeOracleResponse = {
  oracle_address: ORACLE_ADDRESS,
};
