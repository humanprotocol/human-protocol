import { ChainId } from '../../src/enums';

export const DEFAULT_HMTOKEN_ADDR =
  '0x5FbDB2315678afecb367f032d93F642f64180aa3';

export const DEFAULT_STAKING_ADDR =
  '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';

export const DEFAULT_GAS_PAYER_ADDR =
  '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
export const DEFAULT_GAS_PAYER_PRIVKEY =
  'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

export const REPUTATION_ORACLE_ADDR =
  '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
export const REPUTATION_ORACLE_PRIVKEY =
  '59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';

export const TRUSTED_OPERATOR1_ADDR =
  '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';
export const TRUSTED_OPERATOR1_PRIVKEY =
  '5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';

export const TRUSTED_OPERATOR2_ADDR =
  '0x90F79bf6EB2c4f870365E785982E1f101E93b906';

export const WORKER1_ADDR = '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65';
export const WORKER2_ADDR = '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc';
export const WORKER3_ADDR = '0x976EA74026E726554dB657fA54763abd0C3a0aa9';

export const NOT_TRUSTED_OPERATOR_PRIVKEY =
  '5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365b';

export const STORAGE_TEST_ACCESS_KEY = 'my-access-key';
export const STORAGE_TEST_SECRET_KEY = 'my-secret-key';
export const STORAGE_FAKE_BUCKET = 'fake-bucket';
export const STORAGE_TEST_FILE_VALUE = 'value';
export const STORAGE_TEST_FILE_VALUE_2 = 'another value';
export const FAKE_URL = 'fakeUrl';
export const FAKE_NETWORK_NAME = 'fake_network';
export const VALID_URL = 'https://www.humanprotocol.org';

/**
 * @constant Default network parameters
 */
export const FAKE_NETWORK = {
  chainId: ChainId.LOCALHOST,
  title: FAKE_NETWORK_NAME,
  scanUrl: '',
  factoryAddress: '0x0000000000000000000000000000000000000000',
  hmtAddress: '0x0000000000000000000000000000000000000000',
  stakingAddress: '0x0000000000000000000000000000000000000000',
  kvstoreAddress: '0x0000000000000000000000000000000000000000',
  subgraphUrl: 'http://fake.url',
  oldSubgraphUrl: 'http://fake.url',
  oldFactoryAddress: 'http://fake.url',
};

export const FAKE_TRANSACTION_HASH =
  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
export const FAKE_TRANSACTION_CONFIRMATIONS = 1;
export const FAKE_BLOCK_NUMBER = '1234';
export const FAKE_ADDRESS = '0x1234567890abcdef';
export const FAKE_AMOUNT = 100;
export const FAKE_NEGATIVE_AMOUNT = -100;
export const FAKE_HASH =
  '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
