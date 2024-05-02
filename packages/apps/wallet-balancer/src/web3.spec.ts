import {
  Web3Service,
  Web3Env,
  MAINNET_CHAIN_IDS,
  TESTNET_CHAIN_IDS,
  LOCALHOST_CHAIN_IDS,
} from './web3';
import {
  MOCK_WEB3_ADDRESS,
  MOCK_DAILY_LIMIT,
  MOCK_MAX_BALANCE,
  MOCK_MIN_BALANCE,
  MOCK_WEB3_PRIVATE_KEY,
  MOCK_WEB3_GAS_MULTIPLIER,
  MOCK_PGP_PRIVATE_KEY,
  MOCK_PGP_PUBLIC_KEY,
  MOCK_S3_ENDPOINT,
  MOCK_S3_PORT,
  MOCK_S3_ACCESS_KEY,
  MOCK_S3_SECRET_KEY,
  MOCK_S3_BUCKET,
  MOCK_S3_USE_SSL,
  MOCK_WEB3_ENV,
  MOCK_SLACK_WEBHOOK_URL,
} from '../test/constants';
import { ConfigService } from './config';
import { ChainId } from '@human-protocol/sdk';
import { networks } from './networks';
import { Web3Error } from './errors';

const mockProvider = {
  getFeeData: jest.fn().mockResolvedValue({ gasPrice: BigInt(1000000000) }), // 1 Gwei in wei
};

const mockWallet = {
  address: MOCK_WEB3_ADDRESS,
  provider: mockProvider,
};

jest.mock('ethers', () => ({
  ...jest.requireActual('ethers'),
  Wallet: jest.fn().mockImplementation(() => mockWallet),
}));

describe('Web3Service', () => {
  let web3Service: Web3Service;
  let configService: ConfigService;

  beforeEach(() => {
    configService = {
      pgpPrivateKey: MOCK_PGP_PRIVATE_KEY,
      pgpPublicKey: MOCK_PGP_PUBLIC_KEY,
      s3Endpoint: MOCK_S3_ENDPOINT,
      s3Port: MOCK_S3_PORT,
      s3AccessKey: MOCK_S3_ACCESS_KEY,
      s3SecretKey: MOCK_S3_SECRET_KEY,
      s3Bucket: MOCK_S3_BUCKET,
      s3UseSSL: MOCK_S3_USE_SSL,
      web3Env: MOCK_WEB3_ENV,
      web3GasPriceMultiplier: MOCK_WEB3_GAS_MULTIPLIER,
      web3PrivateKey: MOCK_WEB3_PRIVATE_KEY,
      web3HotWalletAddress: MOCK_WEB3_ADDRESS,
      hmtTokenMinBalanceRefillWallet: MOCK_MIN_BALANCE,
      hmtTokenMaxBalanceRefillWallet: MOCK_MAX_BALANCE,
      hmtTokenDailyLimitRefillWallet: MOCK_DAILY_LIMIT,
      nativeTokenMinBalanceRefillWallet: MOCK_MIN_BALANCE,
      nativeTokenMaxBalanceRefillWallet: MOCK_MAX_BALANCE,
      nativeTokenDailyLimitRefillWallet: MOCK_DAILY_LIMIT,
      hmtTokenMinBalanceHotWallet: MOCK_MIN_BALANCE,
      hmtTokenMaxBalanceHotWallet: MOCK_MAX_BALANCE,
      hmtTokenDailyLimitHotWallet: MOCK_DAILY_LIMIT,
      nativeTokenMinBalanceHotWallet: MOCK_MIN_BALANCE,
      nativeTokenMaxBalanceHotWallet: MOCK_MAX_BALANCE,
      nativeTokenDailyLimitHotWallet: MOCK_DAILY_LIMIT,
      slackWebhookUrl: MOCK_SLACK_WEBHOOK_URL,
    };

    web3Service = new Web3Service(configService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSigner', () => {
    it('should return signer for a valid chain', () => {
      const signer = web3Service.getSigner(ChainId.LOCALHOST);
      expect(signer).toBe(mockWallet);
    });

    it('should throw error for an invalid chain', () => {
      expect(() => web3Service.getSigner(ChainId.AVALANCHE)).toThrow(
        Web3Error.INVALID_CHAIN_ID,
      );
    });
  });

  describe('getNetwork', () => {
    it('should return network data for a valid chain', () => {
      const network = web3Service.getNetwork(ChainId.POLYGON);
      expect(network).toEqual(networks[0]);
    });

    it('should throw error for an invalid chain', () => {
      expect(() => web3Service.getNetwork(ChainId.AVALANCHE)).toThrow(
        Web3Error.NETWORK_NOT_FOUND,
      );
    });
  });

  describe('validateChainId', () => {
    it('should not throw error for a valid chain', () => {
      expect(() => web3Service.validateChainId(ChainId.LOCALHOST)).not.toThrow(
        Web3Error.INVALID_CHAIN_ID,
      );
    });

    it('should throw error for an invalid chain', () => {
      expect(() => web3Service.validateChainId(ChainId.AVALANCHE)).toThrow(
        Web3Error.INVALID_CHAIN_ID,
      );
    });
  });

  describe('getValidChains', () => {
    it('should return MAINNET_CHAIN_IDS for Web3Env.MAINNET', () => {
      const web3ServiceMainnet = new Web3Service({
        ...configService,
        web3Env: Web3Env.MAINNET,
      } as any);
      expect(web3ServiceMainnet.getValidChains()).toEqual(MAINNET_CHAIN_IDS);
    });

    it('should return TESTNET_CHAIN_IDS for Web3Env.TESTNET', () => {
      const web3ServiceTestnet = new Web3Service({
        ...configService,
        web3Env: Web3Env.TESTNET,
      } as any);
      expect(web3ServiceTestnet.getValidChains()).toEqual(TESTNET_CHAIN_IDS);
    });

    it('should return LOCALHOST_CHAIN_IDS for Web3Env.LOCALHOST', () => {
      const web3ServiceLocalhost = new Web3Service({
        ...configService,
        web3Env: Web3Env.LOCALHOST,
      } as any);
      expect(web3ServiceLocalhost.getValidChains()).toEqual(
        LOCALHOST_CHAIN_IDS,
      );
    });

    it('should return LOCALHOST_CHAIN_IDS by default', () => {
      const web3ServiceDefault = new Web3Service({
        ...configService,
        web3Env: 'unknown' as Web3Env,
      } as any);
      expect(web3ServiceDefault.getValidChains()).toEqual(LOCALHOST_CHAIN_IDS);
    });
  });

  describe('calculateGasPrice', () => {
    it('should calculate gas price', async () => {
      const gasPrice = await web3Service.calculateGasPrice(ChainId.LOCALHOST);
      expect(Number(gasPrice)).toBe(1000000000);
    });

    it('should throw error if gas price data is not available', async () => {
      mockProvider.getFeeData.mockResolvedValueOnce({ gasPrice: undefined });
      await expect(
        web3Service.calculateGasPrice(ChainId.LOCALHOST),
      ).rejects.toThrow(Web3Error.GAS_PRICE_ERROR);
    });
  });
});
