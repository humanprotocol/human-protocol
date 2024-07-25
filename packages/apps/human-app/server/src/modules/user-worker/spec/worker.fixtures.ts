import { RegisterWorkerCommand, RegisterWorkerData, RegisterWorkerResponse } from '../model/worker-registration.model';

const EXCHANGE_ORACLE_URL = 'https://www.test_url.org';
const WALLER_ADDRESS = 'test_address';
const EMAIL = 'test@email.test';
const TOKEN = 'test-token';
const EXCHANGE_ORACLE_ADDRESS = '0x3dfa342';
export const exchangeOracleUrlFixture = EXCHANGE_ORACLE_URL;
export const workerToken = TOKEN;

export const registerWorkerCommandFixture: RegisterWorkerCommand = {
  oracleAddress: EXCHANGE_ORACLE_ADDRESS,
  token: TOKEN,
};

export const registerWorkerDataFixture: RegisterWorkerData = {
  oracle_address: EXCHANGE_ORACLE_ADDRESS,
};

export const responseWorkerFixture: RegisterWorkerResponse = {
  email: EMAIL,
  wallet_address: WALLER_ADDRESS,
};