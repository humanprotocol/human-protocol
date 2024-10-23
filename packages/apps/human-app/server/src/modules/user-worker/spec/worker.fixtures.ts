import {
  WorkerRegistrationCommand,
  WorkerRegistrationData,
  WorkerRegistrationResponse,
} from '../model/worker-registration.model';

const EXCHANGE_ORACLE_URL = 'https://www.test_url.org';
const WALLER_ADDRESS = 'test_address';
const EMAIL = 'test@email.test';
const TOKEN = 'test-token';
const HCAPTCHA_TOKEN = 'test-token';
const EXCHANGE_ORACLE_ADDRESS = '0x3dfa342';
export const exchangeOracleUrlFixture = EXCHANGE_ORACLE_URL;
export const workerToken = TOKEN;

export const registerWorkerCommandFixture: WorkerRegistrationCommand = {
  oracleAddress: EXCHANGE_ORACLE_ADDRESS,
  hCaptchaToken: HCAPTCHA_TOKEN,
  token: TOKEN,
};

export const registerWorkerDataFixture: WorkerRegistrationData = {
  oracle_address: EXCHANGE_ORACLE_ADDRESS,
  h_captcha_token: HCAPTCHA_TOKEN,
};

export const responseWorkerFixture: WorkerRegistrationResponse = {
  email: EMAIL,
  wallet_address: WALLER_ADDRESS,
};
