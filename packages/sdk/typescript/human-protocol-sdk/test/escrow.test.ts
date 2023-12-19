/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  EscrowFactory__factory,
  Escrow__factory,
  HMToken__factory,
} from '@human-protocol/core/typechain-types';
import { BigNumber, Overrides, ethers } from 'ethers';
import * as gqlFetch from 'graphql-request';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { DEFAULT_TX_ID, NETWORKS } from '../src/constants';
import { ChainId } from '../src/enums';
import {
  ErrorAmountMustBeGreaterThanZero,
  ErrorAmountsCannotBeEmptyArray,
  ErrorEscrowAddressIsNotProvidedByFactory,
  ErrorEscrowDoesNotHaveEnoughBalance,
  ErrorHashIsEmptyString,
  ErrorInvalidAddress,
  ErrorInvalidEscrowAddressProvided,
  ErrorInvalidExchangeOracleAddressProvided,
  ErrorInvalidRecordingOracleAddressProvided,
  ErrorInvalidReputationOracleAddressProvided,
  ErrorInvalidTokenAddress,
  ErrorInvalidUrl,
  ErrorListOfHandlersCannotBeEmpty,
  ErrorProviderDoesNotExist,
  ErrorRecipientAndAmountsMustBeSameLength,
  ErrorRecipientCannotBeEmptyArray,
  ErrorTotalFeeMustBeLessThanHundred,
  ErrorUnsupportedChainID,
  ErrorUrlIsEmptyString,
  EthereumError,
  InvalidEthereumAddressError,
} from '../src/error';
import { EscrowClient, EscrowUtils } from '../src/escrow';
import { GET_ESCROWS_QUERY, GET_ESCROW_BY_ADDRESS_QUERY } from '../src/graphql';
import { EscrowStatus } from '../src/types';
import {
  DEFAULT_GAS_PAYER_PRIVKEY,
  FAKE_ADDRESS,
  FAKE_HASH,
  FAKE_URL,
  VALID_URL,
} from './utils/constants';

vi.mock('graphql-request', () => {
  return {
    default: vi.fn(),
  };
});
vi.mock('../src/init');

describe('EscrowClient', () => {
  const provider = new ethers.providers.JsonRpcProvider();
  let escrowClient: any,
    mockProvider: any,
    mockSigner: any,
    mockEscrowContract: any,
    mockEscrowFactoryContract: any,
    mockTokenContract: any,
    mockTx: any;

  beforeEach(async () => {
    mockProvider = {
      ...provider,
      getNetwork: vi.fn().mockReturnValue({ chainId: ChainId.LOCALHOST }),
    };
    mockSigner = {
      ...provider.getSigner(),
      provider: {
        ...mockProvider,
      },
      getAddress: vi.fn().mockReturnValue(ethers.constants.AddressZero),
    };

    mockEscrowContract = {
      createEscrow: vi.fn(),
      setup: vi.fn(),
      createAndSetupEscrow: vi.fn(),
      fund: vi.fn(),
      storeResults: vi.fn(),
      complete: vi.fn(),
      bulkPayOut: vi.fn(),
      cancel: vi.fn(),
      abort: vi.fn(),
      addTrustedHandlers: vi.fn(),
      getBalance: vi.fn(),
      manifestHash: vi.fn(),
      manifestUrl: vi.fn(),
      finalResultsUrl: vi.fn(),
      token: vi.fn(),
      status: vi.fn(),
      getEscrow: vi.fn(),
      getEscrows: vi.fn(),
      address: ethers.constants.AddressZero,
      canceler: vi.fn(),
      recordingOracle: vi.fn(),
      reputationOracle: vi.fn(),
      exchangeOracle: vi.fn(),
      intermediateResultsUrl: vi.fn(),
      launcher: vi.fn(),
      escrowFactory: vi.fn(),
    };

    mockEscrowFactoryContract = {
      createEscrow: vi.fn(),
      hasEscrow: vi.fn(),
      lastEscrow: vi.fn(),
    };

    mockTokenContract = {
      allowance: vi.fn(),
      approve: vi.fn(),
      transfer: vi.fn(),
    };

    mockTx = {
      wait: vi.fn(),
    };

    // Mock EscrowFactory__factory.connect to return the mock EscrowFactory
    vi.spyOn(EscrowFactory__factory, 'connect').mockReturnValue(
      mockEscrowFactoryContract
    );

    // Mock Escrow__factory.connect to return the mock Escrow
    vi.spyOn(Escrow__factory, 'connect').mockReturnValue(mockEscrowContract);

    // Mock HMToken__factory.connect to return the mock HMToken
    vi.spyOn(HMToken__factory, 'connect').mockReturnValue(mockTokenContract);

    escrowClient = await EscrowClient.build(mockSigner);
    escrowClient.escrowContract = mockEscrowContract;
    escrowClient.tokenContract = mockTokenContract;
    escrowClient.escrowFactoryContract = mockEscrowFactoryContract;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('build', () => {
    test('should create a new instance of EscrowClient with a Signer', async () => {
      const escrowClient = await EscrowClient.build(mockSigner);

      expect(escrowClient).toBeInstanceOf(EscrowClient);
    });

    test('should create a new instance of EscrowClient with a Provider', async () => {
      const provider = ethers.getDefaultProvider();

      const escrowClient = await EscrowClient.build(provider);

      expect(escrowClient).toBeInstanceOf(EscrowClient);
    });

    test('should throw an error if Signer provider does not exist', async () => {
      const signer = new ethers.Wallet(DEFAULT_GAS_PAYER_PRIVKEY);

      await expect(EscrowClient.build(signer)).rejects.toThrow(
        ErrorProviderDoesNotExist
      );
    });

    test('should throw an error if the chain ID is unsupported', async () => {
      const provider = ethers.getDefaultProvider();

      vi.spyOn(provider, 'getNetwork').mockResolvedValue({
        chainId: 1337,
      } as any);

      await expect(EscrowClient.build(provider)).rejects.toThrow(
        ErrorUnsupportedChainID
      );
    });
  });

  describe('createEscrow', () => {
    test('should throw an error if tokenAddress is an invalid address', async () => {
      const invalidAddress = FAKE_ADDRESS;

      await expect(
        escrowClient.createEscrow(invalidAddress, [
          ethers.constants.AddressZero,
        ])
      ).rejects.toThrow(ErrorInvalidTokenAddress);
    });

    test('should throw an error if trustedHandlers contains an invalid address', async () => {
      await expect(
        escrowClient.createEscrow(ethers.constants.AddressZero, [FAKE_ADDRESS])
      ).rejects.toThrow(new InvalidEthereumAddressError(FAKE_ADDRESS));
    });

    test('should create an escrow and return its address', async () => {
      const tokenAddress = ethers.constants.AddressZero;
      const trustedHandlers = [ethers.constants.AddressZero];
      const jobRequesterId = 'job-requester';
      const expectedEscrowAddress = ethers.constants.AddressZero;

      // Create a spy object for the createEscrow method
      const createEscrowSpy = vi
        .spyOn(escrowClient.escrowFactoryContract, 'createEscrow')
        .mockImplementation(() => ({
          wait: async () => ({
            events: [
              {
                topics: [ethers.utils.id('LaunchedV2(address,address,string)')],
                args: {
                  escrow: expectedEscrowAddress,
                },
              },
            ],
          }),
        }));

      const result = await escrowClient.createEscrow(
        tokenAddress,
        trustedHandlers,
        jobRequesterId
      );

      expect(createEscrowSpy).toHaveBeenCalledWith(
        tokenAddress,
        trustedHandlers,
        jobRequesterId,
        {}
      );
      expect(result).toBe(expectedEscrowAddress);
    });

    test('should throw an error if the create an escrow fails', async () => {
      const tokenAddress = ethers.constants.AddressZero;
      const trustedHandlers = [ethers.constants.AddressZero];
      const jobRequesterId = 'job-requester';

      escrowClient.escrowFactoryContract.createEscrow.mockRejectedValueOnce(
        new Error()
      );

      await expect(
        escrowClient.createEscrow(tokenAddress, trustedHandlers, jobRequesterId)
      ).rejects.toThrow();

      expect(
        escrowClient.escrowFactoryContract.createEscrow
      ).toHaveBeenCalledWith(tokenAddress, trustedHandlers, jobRequesterId, {});
    });

    test('should create an escrow and return its address with transaction options', async () => {
      const tokenAddress = ethers.constants.AddressZero;
      const trustedHandlers = [ethers.constants.AddressZero];
      const jobRequesterId = 'job-requester';
      const expectedEscrowAddress = ethers.constants.AddressZero;

      // Create a spy object for the createEscrow method
      const createEscrowSpy = vi
        .spyOn(escrowClient.escrowFactoryContract, 'createEscrow')
        .mockImplementation(() => ({
          wait: async () => ({
            events: [
              {
                topics: [ethers.utils.id('LaunchedV2(address,address,string)')],
                args: {
                  escrow: expectedEscrowAddress,
                },
              },
            ],
          }),
        }));

      const txOptions: Overrides = { gasLimit: 45000 };

      const result = await escrowClient.createEscrow(
        tokenAddress,
        trustedHandlers,
        jobRequesterId,
        txOptions
      );

      expect(createEscrowSpy).toHaveBeenCalledWith(
        tokenAddress,
        trustedHandlers,
        jobRequesterId,
        txOptions
      );
      expect(result).toBe(expectedEscrowAddress);
    });
  });

  describe('setup', () => {
    test('should throw an error if recordingOracle is an invalid address', async () => {
      const escrowConfig = {
        recordingOracle: FAKE_ADDRESS,
        reputationOracle: ethers.constants.AddressZero,
        exchangeOracle: ethers.constants.AddressZero,
        recordingOracleFee: BigNumber.from(10),
        reputationOracleFee: BigNumber.from(10),
        exchangeOracleFee: BigNumber.from(10),
        manifestUrl: VALID_URL,
        hash: FAKE_HASH,
      };

      await expect(
        escrowClient.setup(ethers.constants.AddressZero, escrowConfig)
      ).rejects.toThrow(ErrorInvalidRecordingOracleAddressProvided);
    });

    test('should throw an error if reputationOracle is an invalid address', async () => {
      const escrowConfig = {
        recordingOracle: ethers.constants.AddressZero,
        reputationOracle: FAKE_ADDRESS,
        exchangeOracle: ethers.constants.AddressZero,
        recordingOracleFee: BigNumber.from(10),
        reputationOracleFee: BigNumber.from(10),
        exchangeOracleFee: BigNumber.from(10),
        manifestUrl: VALID_URL,
        hash: FAKE_HASH,
      };

      await expect(
        escrowClient.setup(ethers.constants.AddressZero, escrowConfig)
      ).rejects.toThrow(ErrorInvalidReputationOracleAddressProvided);
    });

    test('should throw an error if exchangeOracle is an invalid address', async () => {
      const escrowConfig = {
        recordingOracle: ethers.constants.AddressZero,
        reputationOracle: ethers.constants.AddressZero,
        exchangeOracle: FAKE_ADDRESS,
        recordingOracleFee: BigNumber.from(10),
        reputationOracleFee: BigNumber.from(10),
        exchangeOracleFee: BigNumber.from(10),
        manifestUrl: VALID_URL,
        hash: FAKE_HASH,
      };

      await expect(
        escrowClient.setup(ethers.constants.AddressZero, escrowConfig)
      ).rejects.toThrow(ErrorInvalidExchangeOracleAddressProvided);
    });

    test('should throw an error if escrowAddress is an invalid address', async () => {
      const escrowConfig = {
        recordingOracle: ethers.constants.AddressZero,
        reputationOracle: ethers.constants.AddressZero,
        exchangeOracle: ethers.constants.AddressZero,
        recordingOracleFee: BigNumber.from(10),
        reputationOracleFee: BigNumber.from(10),
        exchangeOracleFee: BigNumber.from(10),
        manifestUrl: VALID_URL,
        hash: FAKE_HASH,
      };

      await expect(
        escrowClient.setup(FAKE_ADDRESS, escrowConfig)
      ).rejects.toThrow(ErrorInvalidEscrowAddressProvided);
    });

    test('should throw an error if hasEscrow returns false', async () => {
      const escrowConfig = {
        recordingOracle: ethers.constants.AddressZero,
        reputationOracle: ethers.constants.AddressZero,
        exchangeOracle: ethers.constants.AddressZero,
        recordingOracleFee: BigNumber.from(10),
        reputationOracleFee: BigNumber.from(10),
        exchangeOracleFee: BigNumber.from(10),
        manifestUrl: VALID_URL,
        manifestHash: FAKE_HASH,
      };

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(
        escrowClient.setup(ethers.constants.AddressZero, escrowConfig)
      ).rejects.toThrow(ErrorEscrowAddressIsNotProvidedByFactory);
    });

    test('should throw an error if 0 <= recordingOracleFee', async () => {
      const escrowConfig = {
        recordingOracle: ethers.constants.AddressZero,
        reputationOracle: ethers.constants.AddressZero,
        exchangeOracle: ethers.constants.AddressZero,
        recordingOracleFee: BigNumber.from(0),
        reputationOracleFee: BigNumber.from(10),
        exchangeOracleFee: BigNumber.from(10),
        manifestUrl: VALID_URL,
        hash: FAKE_HASH,
      };

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      await expect(
        escrowClient.setup(ethers.constants.AddressZero, escrowConfig)
      ).rejects.toThrow(ErrorAmountMustBeGreaterThanZero);
    });

    test('should throw an error if 0 <= reputationOracleFee', async () => {
      const escrowConfig = {
        recordingOracle: ethers.constants.AddressZero,
        reputationOracle: ethers.constants.AddressZero,
        exchangeOracle: ethers.constants.AddressZero,
        recordingOracleFee: BigNumber.from(10),
        reputationOracleFee: BigNumber.from(0),
        exchangeOracleFee: BigNumber.from(10),
        manifestUrl: VALID_URL,
        hash: FAKE_HASH,
      };

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      await expect(
        escrowClient.setup(ethers.constants.AddressZero, escrowConfig)
      ).rejects.toThrow(ErrorAmountMustBeGreaterThanZero);
    });

    test('should throw an error if 0 <= exchangeOracleFee', async () => {
      const escrowConfig = {
        recordingOracle: ethers.constants.AddressZero,
        reputationOracle: ethers.constants.AddressZero,
        exchangeOracle: ethers.constants.AddressZero,
        recordingOracleFee: BigNumber.from(10),
        reputationOracleFee: BigNumber.from(10),
        exchangeOracleFee: BigNumber.from(0),
        manifestUrl: VALID_URL,
        hash: FAKE_HASH,
      };

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      await expect(
        escrowClient.setup(ethers.constants.AddressZero, escrowConfig)
      ).rejects.toThrow(ErrorAmountMustBeGreaterThanZero);
    });

    test('should throw an error if total fee is greater than 100', async () => {
      const escrowConfig = {
        recordingOracle: ethers.constants.AddressZero,
        reputationOracle: ethers.constants.AddressZero,
        exchangeOracle: ethers.constants.AddressZero,
        recordingOracleFee: BigNumber.from(40),
        reputationOracleFee: BigNumber.from(40),
        exchangeOracleFee: BigNumber.from(40),
        manifestUrl: VALID_URL,
        hash: FAKE_HASH,
      };

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      await expect(
        escrowClient.setup(ethers.constants.AddressZero, escrowConfig)
      ).rejects.toThrow(ErrorTotalFeeMustBeLessThanHundred);
    });

    test('should throw an error if manifestUrl is an empty string', async () => {
      const escrowConfig = {
        recordingOracle: ethers.constants.AddressZero,
        reputationOracle: ethers.constants.AddressZero,
        exchangeOracle: ethers.constants.AddressZero,
        recordingOracleFee: BigNumber.from(10),
        reputationOracleFee: BigNumber.from(10),
        exchangeOracleFee: BigNumber.from(10),
        manifestUrl: '',
        hash: FAKE_HASH,
      };

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      await expect(
        escrowClient.setup(ethers.constants.AddressZero, escrowConfig)
      ).rejects.toThrow(ErrorUrlIsEmptyString);
    });

    test('should throw an error if manifestUrl is an invalid url', async () => {
      const escrowConfig = {
        recordingOracle: ethers.constants.AddressZero,
        reputationOracle: ethers.constants.AddressZero,
        exchangeOracle: ethers.constants.AddressZero,
        recordingOracleFee: BigNumber.from(10),
        reputationOracleFee: BigNumber.from(10),
        exchangeOracleFee: BigNumber.from(10),
        manifestUrl: FAKE_URL,
        hash: FAKE_HASH,
      };

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      await expect(
        escrowClient.setup(ethers.constants.AddressZero, escrowConfig)
      ).rejects.toThrow(ErrorInvalidUrl);
    });

    test('should throw an error if hash is an empty string', async () => {
      const escrowConfig = {
        recordingOracle: ethers.constants.AddressZero,
        reputationOracle: ethers.constants.AddressZero,
        exchangeOracle: ethers.constants.AddressZero,
        recordingOracleFee: BigNumber.from(10),
        reputationOracleFee: BigNumber.from(10),
        exchangeOracleFee: BigNumber.from(10),
        manifestUrl: VALID_URL,
        hash: '',
      };

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      await expect(
        escrowClient.setup(ethers.constants.AddressZero, escrowConfig)
      ).rejects.toThrow(ErrorHashIsEmptyString);
    });

    test('should successfully setup escrow', async () => {
      const escrowConfig = {
        recordingOracle: ethers.constants.AddressZero,
        reputationOracle: ethers.constants.AddressZero,
        exchangeOracle: ethers.constants.AddressZero,
        recordingOracleFee: BigNumber.from(10),
        reputationOracleFee: BigNumber.from(10),
        exchangeOracleFee: BigNumber.from(10),
        manifestUrl: VALID_URL,
        manifestHash: FAKE_HASH,
      };

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      const setupSpy = vi
        .spyOn(escrowClient.escrowContract, 'setup')
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));

      await escrowClient.setup(ethers.constants.AddressZero, escrowConfig);

      expect(setupSpy).toHaveBeenCalledWith(
        ethers.constants.AddressZero,
        ethers.constants.AddressZero,
        ethers.constants.AddressZero,
        BigNumber.from(10),
        BigNumber.from(10),
        BigNumber.from(10),
        VALID_URL,
        FAKE_HASH,
        {}
      );
    });

    test('should throw an error if setup escrow fails', async () => {
      const escrowConfig = {
        recordingOracle: ethers.constants.AddressZero,
        reputationOracle: ethers.constants.AddressZero,
        exchangeOracle: ethers.constants.AddressZero,
        recordingOracleFee: BigNumber.from(10),
        reputationOracleFee: BigNumber.from(10),
        exchangeOracleFee: BigNumber.from(10),
        manifestUrl: VALID_URL,
        manifestHash: FAKE_HASH,
      };

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.setup.mockRejectedValueOnce(new Error());

      await expect(
        escrowClient.setup(ethers.constants.AddressZero, escrowConfig)
      ).rejects.toThrow();

      expect(escrowClient.escrowContract.setup).toHaveBeenCalledWith(
        ethers.constants.AddressZero,
        ethers.constants.AddressZero,
        ethers.constants.AddressZero,
        BigNumber.from(10),
        BigNumber.from(10),
        BigNumber.from(10),
        VALID_URL,
        FAKE_HASH,
        {}
      );
    });

    test('should successfully setup escrow with transaction options', async () => {
      const escrowConfig = {
        recordingOracle: ethers.constants.AddressZero,
        reputationOracle: ethers.constants.AddressZero,
        exchangeOracle: ethers.constants.AddressZero,
        recordingOracleFee: BigNumber.from(10),
        reputationOracleFee: BigNumber.from(10),
        exchangeOracleFee: BigNumber.from(10),
        manifestUrl: VALID_URL,
        manifestHash: FAKE_HASH,
      };

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      const setupSpy = vi
        .spyOn(escrowClient.escrowContract, 'setup')
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));

      const txOptions: Overrides = { gasLimit: 45000 };

      await escrowClient.setup(
        ethers.constants.AddressZero,
        escrowConfig,
        txOptions
      );

      expect(setupSpy).toHaveBeenCalledWith(
        ethers.constants.AddressZero,
        ethers.constants.AddressZero,
        ethers.constants.AddressZero,
        BigNumber.from(10),
        BigNumber.from(10),
        BigNumber.from(10),
        VALID_URL,
        FAKE_HASH,
        txOptions
      );
    });
  });

  describe('createAndSetupEscrow', () => {
    test('should successfully create and setup escrow', async () => {
      const escrowAddress = ethers.constants.AddressZero;
      const tokenAddress = ethers.constants.AddressZero;
      const trustedHandlers = [ethers.constants.AddressZero];
      const jobRequesterId = 'job-requester';

      const escrowConfig = {
        recordingOracle: ethers.constants.AddressZero,
        reputationOracle: ethers.constants.AddressZero,
        exchangeOracle: ethers.constants.AddressZero,
        recordingOracleFee: BigNumber.from(10),
        reputationOracleFee: BigNumber.from(10),
        exchangeOracleFee: BigNumber.from(10),
        manifestUrl: VALID_URL,
        manifestHash: FAKE_HASH,
      };

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.createEscrow = vi.fn().mockReturnValue(escrowAddress);
      const setupSpy = vi
        .spyOn(escrowClient.escrowContract, 'setup')
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));

      await escrowClient.createAndSetupEscrow(
        tokenAddress,
        trustedHandlers,
        jobRequesterId,
        escrowConfig
      );

      expect(escrowClient.createEscrow).toHaveBeenCalledWith(
        tokenAddress,
        trustedHandlers,
        jobRequesterId
      );
      expect(setupSpy).toHaveBeenCalledWith(
        ethers.constants.AddressZero,
        ethers.constants.AddressZero,
        ethers.constants.AddressZero,
        BigNumber.from(10),
        BigNumber.from(10),
        BigNumber.from(10),
        VALID_URL,
        FAKE_HASH,
        {}
      );
    });

    test('should throw an error if setup escrow fails', async () => {
      const escrowConfig = {
        recordingOracle: ethers.constants.AddressZero,
        reputationOracle: ethers.constants.AddressZero,
        exchangeOracle: ethers.constants.AddressZero,
        recordingOracleFee: BigNumber.from(10),
        reputationOracleFee: BigNumber.from(10),
        exchangeOracleFee: BigNumber.from(10),
        manifestUrl: VALID_URL,
        manifestHash: FAKE_HASH,
      };

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.setup.mockRejectedValueOnce(new Error());

      await expect(
        escrowClient.setup(ethers.constants.AddressZero, escrowConfig)
      ).rejects.toThrow();

      expect(escrowClient.escrowContract.setup).toHaveBeenCalledWith(
        ethers.constants.AddressZero,
        ethers.constants.AddressZero,
        ethers.constants.AddressZero,
        BigNumber.from(10),
        BigNumber.from(10),
        BigNumber.from(10),
        VALID_URL,
        FAKE_HASH,
        {}
      );
    });
  });

  describe('fund', () => {
    test('should throw an error if escrowAddress is an invalid address', async () => {
      const invalidAddress = FAKE_ADDRESS;
      const amount = BigNumber.from(10);

      await expect(escrowClient.fund(invalidAddress, amount)).rejects.toThrow(
        ErrorInvalidEscrowAddressProvided
      );
    });

    test('should throw an error if hasEscrow returns false', async () => {
      const escrowAddress = ethers.constants.AddressZero;
      const amount = BigNumber.from(10);

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(escrowClient.fund(escrowAddress, amount)).rejects.toThrow(
        ErrorEscrowAddressIsNotProvidedByFactory
      );
    });

    test('should throw an error if 0 <= amount', async () => {
      const escrowAddress = ethers.constants.AddressZero;
      const invalidAmount = BigNumber.from(0);

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      await expect(
        escrowClient.fund(escrowAddress, invalidAmount)
      ).rejects.toThrow(ErrorAmountMustBeGreaterThanZero);
    });

    test('should successfully fund escrow', async () => {
      const tokenAddress = ethers.constants.AddressZero;
      const escrowAddress = ethers.constants.AddressZero;
      const amount = BigNumber.from(10);

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.token.mockReturnValue(tokenAddress);
      const transferSpy = vi
        .spyOn(escrowClient.tokenContract, 'transfer')
        .mockImplementation(() => ({
          wait: vi.fn(),
        }));

      await escrowClient.fund(escrowAddress, amount);

      expect(escrowClient.escrowContract.token).toHaveBeenCalledWith();
      expect(transferSpy).toHaveBeenCalledWith(escrowAddress, amount, {});
    });

    test('should throw an error if transfer fails', async () => {
      const tokenAddress = ethers.constants.AddressZero;
      const escrowAddress = ethers.constants.AddressZero;
      const amount = BigNumber.from(10);

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.token.mockReturnValue(tokenAddress);
      escrowClient.tokenContract.transfer.mockRejectedValueOnce(new Error());

      await expect(escrowClient.fund(escrowAddress, amount)).rejects.toThrow();

      expect(escrowClient.escrowContract.token).toHaveBeenCalledWith();
    });

    test('should successfully fund escrow with transaction options', async () => {
      const tokenAddress = ethers.constants.AddressZero;
      const escrowAddress = ethers.constants.AddressZero;
      const amount = BigNumber.from(10);

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.token.mockReturnValue(tokenAddress);
      const transferSpy = vi
        .spyOn(escrowClient.tokenContract, 'transfer')
        .mockImplementation(() => ({
          wait: vi.fn(),
        }));
      const txOptions: Overrides = { gasLimit: 45000 };

      await escrowClient.fund(escrowAddress, amount, txOptions);

      expect(escrowClient.escrowContract.token).toHaveBeenCalledWith();
      expect(transferSpy).toHaveBeenCalledWith(
        escrowAddress,
        amount,
        txOptions
      );
    });
  });

  describe('storeResults', () => {
    test('should throw an error if escrowAddress is an invalid address', async () => {
      const invalidAddress = FAKE_ADDRESS;
      const url = VALID_URL;
      const hash = FAKE_HASH;

      await expect(
        escrowClient.storeResults(invalidAddress, url, hash)
      ).rejects.toThrow(ErrorInvalidEscrowAddressProvided);
    });

    test('should throw an error if hasEscrow returns false', async () => {
      const escrowAddress = ethers.constants.AddressZero;
      const url = VALID_URL;
      const hash = FAKE_HASH;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(
        escrowClient.storeResults(escrowAddress, url, hash)
      ).rejects.toThrow(ErrorEscrowAddressIsNotProvidedByFactory);
    });

    test('should throw an error if url is an empty string', async () => {
      const escrowAddress = ethers.constants.AddressZero;
      const url = '';
      const hash = FAKE_HASH;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      await expect(
        escrowClient.storeResults(escrowAddress, url, hash)
      ).rejects.toThrow(ErrorUrlIsEmptyString);
    });

    test('should throw an error if results url is invalid url', async () => {
      const escrowAddress = ethers.constants.AddressZero;
      const url = FAKE_URL;
      const hash = FAKE_HASH;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      await expect(
        escrowClient.storeResults(escrowAddress, url, hash)
      ).rejects.toThrow(ErrorInvalidUrl);
    });

    test('should throw an error if hash is an empty string', async () => {
      const escrowAddress = ethers.constants.AddressZero;
      const url = VALID_URL;
      const hash = '';

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      await expect(
        escrowClient.storeResults(escrowAddress, url, hash)
      ).rejects.toThrow(ErrorHashIsEmptyString);
    });

    test('should successfully store results', async () => {
      const escrowAddress = ethers.constants.AddressZero;
      const url = VALID_URL;
      const hash = FAKE_HASH;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      const storeResultsSpy = vi
        .spyOn(escrowClient.escrowContract, 'storeResults')
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));

      await escrowClient.storeResults(escrowAddress, url, hash);

      expect(storeResultsSpy).toHaveBeenCalledWith(url, hash, {});
    });

    test('should throw an error if the store results fails', async () => {
      const escrowAddress = ethers.constants.AddressZero;
      const url = VALID_URL;
      const hash = FAKE_HASH;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.storeResults.mockRejectedValueOnce(
        new Error()
      );

      await expect(
        escrowClient.storeResults(escrowAddress, url, hash)
      ).rejects.toThrow();

      expect(escrowClient.escrowContract.storeResults).toHaveBeenCalledWith(
        url,
        hash,
        {}
      );
    });

    test('should successfully store results with transaction options', async () => {
      const escrowAddress = ethers.constants.AddressZero;
      const url = VALID_URL;
      const hash = FAKE_HASH;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      const storeResultsSpy = vi
        .spyOn(escrowClient.escrowContract, 'storeResults')
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));
      const txOptions: Overrides = { gasLimit: 45000 };

      await escrowClient.storeResults(escrowAddress, url, hash, txOptions);

      expect(storeResultsSpy).toHaveBeenCalledWith(url, hash, txOptions);
    });
  });

  describe('complete', () => {
    test('should throw an error if escrowAddress is an invalid address', async () => {
      const invalidAddress = FAKE_ADDRESS;

      await expect(escrowClient.complete(invalidAddress)).rejects.toThrow(
        ErrorInvalidEscrowAddressProvided
      );
    });

    test('should throw an error if hasEscrow returns false', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(escrowClient.complete(escrowAddress)).rejects.toThrow(
        ErrorEscrowAddressIsNotProvidedByFactory
      );
    });

    test('should successfully complete escrow', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      const completeSpy = vi
        .spyOn(escrowClient.escrowContract, 'complete')
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));

      await escrowClient.complete(escrowAddress);

      expect(completeSpy).toHaveBeenCalledWith({});
    });

    test('should throw an error if the complete fails', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.complete.mockRejectedValueOnce(new Error());

      await expect(escrowClient.complete(escrowAddress)).rejects.toThrow();

      expect(escrowClient.escrowContract.complete).toHaveBeenCalledWith({});
    });

    test('should successfully complete escrow with transaction options', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      const completeSpy = vi
        .spyOn(escrowClient.escrowContract, 'complete')
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));

      const txOptions: Overrides = { gasLimit: 45000 };
      await escrowClient.complete(escrowAddress, txOptions);

      expect(completeSpy).toHaveBeenCalledWith(txOptions);
    });
  });

  describe('bulkPayOut', () => {
    test('should throw an error if escrowAddress is an invalid address', async () => {
      const invalidAddress = FAKE_ADDRESS;
      const recipients = [ethers.constants.AddressZero];
      const amounts = [BigNumber.from(100)];
      const finalResultsUrl = VALID_URL;
      const finalResultsHash = FAKE_HASH;

      await expect(
        escrowClient.bulkPayOut(
          invalidAddress,
          recipients,
          amounts,
          finalResultsUrl,
          finalResultsHash
        )
      ).rejects.toThrow(ErrorInvalidEscrowAddressProvided);
    });

    test('should throw an error if hasEscrow returns false', async () => {
      const escrowAddress = ethers.constants.AddressZero;
      const recipients = [ethers.constants.AddressZero];
      const amounts = [BigNumber.from(100)];
      const finalResultsUrl = VALID_URL;
      const finalResultsHash = FAKE_HASH;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(
        escrowClient.bulkPayOut(
          escrowAddress,
          recipients,
          amounts,
          finalResultsUrl,
          finalResultsHash
        )
      ).rejects.toThrow(ErrorEscrowAddressIsNotProvidedByFactory);
    });

    test('should throw an error if recipients length is equal to 0', async () => {
      const escrowAddress = ethers.constants.AddressZero;
      const recipients: string[] = [];
      const amounts = [BigNumber.from(100)];
      const finalResultsUrl = VALID_URL;
      const finalResultsHash = FAKE_HASH;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      await expect(
        escrowClient.bulkPayOut(
          escrowAddress,
          recipients,
          amounts,
          finalResultsUrl,
          finalResultsHash
        )
      ).rejects.toThrow(ErrorRecipientCannotBeEmptyArray);
    });

    test('should throw an error if amounts length is equal to 0', async () => {
      const escrowAddress = ethers.constants.AddressZero;
      const recipients = [ethers.constants.AddressZero];
      const amounts: number[] = [];
      const finalResultsUrl = VALID_URL;
      const finalResultsHash = FAKE_HASH;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      await expect(
        escrowClient.bulkPayOut(
          escrowAddress,
          recipients,
          amounts,
          finalResultsUrl,
          finalResultsHash
        )
      ).rejects.toThrow(ErrorAmountsCannotBeEmptyArray);
    });

    test('should throw an error if recipients and amounts do not have the same length', async () => {
      const escrowAddress = ethers.constants.AddressZero;
      const recipients = [ethers.constants.AddressZero];
      const amounts = [
        BigNumber.from(100),
        BigNumber.from(100),
        BigNumber.from(100),
      ];
      const finalResultsUrl = VALID_URL;
      const finalResultsHash = FAKE_HASH;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      await expect(
        escrowClient.bulkPayOut(
          escrowAddress,
          recipients,
          amounts,
          finalResultsUrl,
          finalResultsHash
        )
      ).rejects.toThrow(ErrorRecipientAndAmountsMustBeSameLength);
    });

    test('should throw an error if recipients contains invalid addresses', async () => {
      const escrowAddress = ethers.constants.AddressZero;
      const recipients = [FAKE_ADDRESS];
      const amounts = [BigNumber.from(100)];
      const finalResultsUrl = VALID_URL;
      const finalResultsHash = FAKE_HASH;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      await expect(
        escrowClient.bulkPayOut(
          escrowAddress,
          recipients,
          amounts,
          finalResultsUrl,
          finalResultsHash
        )
      ).rejects.toThrow(new InvalidEthereumAddressError(FAKE_ADDRESS));
    });

    test('should throw an error if url is an empty string', async () => {
      const escrowAddress = ethers.constants.AddressZero;
      const recipients = [ethers.constants.AddressZero];
      const amounts = [BigNumber.from(100)];
      const finalResultsUrl = '';
      const finalResultsHash = FAKE_HASH;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      await expect(
        escrowClient.bulkPayOut(
          escrowAddress,
          recipients,
          amounts,
          finalResultsUrl,
          finalResultsHash
        )
      ).rejects.toThrow(ErrorUrlIsEmptyString);
    });

    test('should throw an error if final results url is an invalid url', async () => {
      const escrowAddress = ethers.constants.AddressZero;
      const recipients = [ethers.constants.AddressZero];
      const amounts = [BigNumber.from(100)];
      const finalResultsUrl = FAKE_URL;
      const finalResultsHash = FAKE_HASH;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      await expect(
        escrowClient.bulkPayOut(
          escrowAddress,
          recipients,
          amounts,
          finalResultsUrl,
          finalResultsHash
        )
      ).rejects.toThrow(ErrorInvalidUrl);
    });

    test('should throw an error if hash is an empty string', async () => {
      const escrowAddress = ethers.constants.AddressZero;
      const recipients = [ethers.constants.AddressZero];
      const amounts = [BigNumber.from(100)];
      const finalResultsUrl = VALID_URL;
      const finalResultsHash = '';

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      await expect(
        escrowClient.bulkPayOut(
          escrowAddress,
          recipients,
          amounts,
          finalResultsUrl,
          finalResultsHash
        )
      ).rejects.toThrow(ErrorHashIsEmptyString);
    });

    test('should throw an error if escrow does not have enough balance', async () => {
      const escrowAddress = ethers.constants.AddressZero;
      const recipients = [
        ethers.constants.AddressZero,
        ethers.constants.AddressZero,
      ];
      const amounts = [BigNumber.from(90), BigNumber.from(20)];
      const finalResultsUrl = VALID_URL;
      const finalResultsHash = FAKE_HASH;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.getBalance = vi.fn().mockReturnValue(BigNumber.from(50));

      await expect(
        escrowClient.bulkPayOut(
          escrowAddress,
          recipients,
          amounts,
          finalResultsUrl,
          finalResultsHash
        )
      ).rejects.toThrow(ErrorEscrowDoesNotHaveEnoughBalance);
    });

    test('should successfully bulkPayOut escrow', async () => {
      const escrowAddress = ethers.constants.AddressZero;
      const recipients = [
        ethers.constants.AddressZero,
        ethers.constants.AddressZero,
      ];
      const amounts = [BigNumber.from(10), BigNumber.from(10)];
      const finalResultsUrl = VALID_URL;
      const finalResultsHash = FAKE_HASH;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.getBalance = vi.fn().mockReturnValue(BigNumber.from(100));

      const bulkPayOutSpy = vi
        .spyOn(escrowClient.escrowContract, 'bulkPayOut')
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));

      await escrowClient.bulkPayOut(
        escrowAddress,
        recipients,
        amounts,
        finalResultsUrl,
        finalResultsHash
      );

      expect(bulkPayOutSpy).toHaveBeenCalledWith(
        recipients,
        amounts,
        finalResultsUrl,
        finalResultsHash,
        DEFAULT_TX_ID,
        {}
      );
    });

    test('should throw an error if bulkPayOut fails', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.abort.mockRejectedValueOnce(new Error());

      await expect(escrowClient.abort(escrowAddress)).rejects.toThrow();

      expect(escrowClient.escrowContract.abort).toHaveBeenCalledWith({});
    });

    test('should successfully bulkPayOut escrow with transaction options', async () => {
      const escrowAddress = ethers.constants.AddressZero;
      const recipients = [
        ethers.constants.AddressZero,
        ethers.constants.AddressZero,
      ];
      const amounts = [BigNumber.from(10), BigNumber.from(10)];
      const finalResultsUrl = VALID_URL;
      const finalResultsHash = FAKE_HASH;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.getBalance = vi.fn().mockReturnValue(BigNumber.from(100));

      const bulkPayOutSpy = vi
        .spyOn(escrowClient.escrowContract, 'bulkPayOut')
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));
      const txOptions: Overrides = { gasLimit: 45000 };

      await escrowClient.bulkPayOut(
        escrowAddress,
        recipients,
        amounts,
        finalResultsUrl,
        finalResultsHash,
        txOptions
      );

      expect(bulkPayOutSpy).toHaveBeenCalledWith(
        recipients,
        amounts,
        finalResultsUrl,
        finalResultsHash,
        DEFAULT_TX_ID,
        txOptions
      );
    });
  });

  describe('cancel', () => {
    test('should throw an error if escrowAddress is an invalid address', async () => {
      const invalidAddress = FAKE_ADDRESS;

      await expect(escrowClient.cancel(invalidAddress)).rejects.toThrow(
        ErrorInvalidEscrowAddressProvided
      );
    });

    test('should throw an error if hasEscrow returns false', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(escrowClient.cancel(escrowAddress)).rejects.toThrow(
        ErrorEscrowAddressIsNotProvidedByFactory
      );
    });

    test('should successfully cancel escrow', async () => {
      const escrowAddress = ethers.constants.AddressZero;
      const amountRefunded = BigNumber.from(1);

      escrowClient.escrowContract.token.mockResolvedValueOnce(
        ethers.constants.AddressZero
      );

      const log = {
        address: ethers.constants.AddressZero,
        name: 'Transfer',
        args: [
          ethers.constants.AddressZero,
          ethers.constants.AddressZero,
          amountRefunded,
        ],
      };
      mockTx.wait.mockResolvedValueOnce({
        transactionHash: FAKE_HASH,
        logs: [log],
      });

      const mockHMTokenFactoryContract = {
        interface: {
          parseLog: vi.fn().mockReturnValueOnce(log),
        },
      };

      vi.spyOn(HMToken__factory, 'connect').mockReturnValue(
        mockHMTokenFactoryContract as any
      );

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.cancel.mockResolvedValueOnce(mockTx);

      const result = await escrowClient.cancel(escrowAddress);

      expect(result).toStrictEqual({
        amountRefunded,
        txHash: FAKE_HASH,
      });
      expect(escrowClient.escrowContract.cancel).toHaveBeenCalledWith({});
    });

    test('should throw an error if the cancel fails', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.cancel.mockRejectedValueOnce(new Error());

      await expect(escrowClient.cancel(escrowAddress)).rejects.toThrow();

      expect(escrowClient.escrowContract.cancel).toHaveBeenCalledWith({});
    });

    test('should throw an error if the wait fails', async () => {
      const escrowAddress = ethers.constants.AddressZero;
      mockTx.wait.mockRejectedValueOnce(new Error());
      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.cancel.mockResolvedValueOnce(mockTx);

      await expect(escrowClient.cancel(escrowAddress)).rejects.toThrow();

      expect(escrowClient.escrowContract.cancel).toHaveBeenCalledWith({});
    });

    test('should throw an error if transfer event not found in transaction logs', async () => {
      const escrowAddress = ethers.constants.AddressZero;
      mockTx.wait.mockResolvedValueOnce({
        transactionHash: FAKE_HASH,
        logs: [
          {
            address: ethers.constants.AddressZero,
            name: 'NotTransfer',
            args: [
              ethers.constants.AddressZero,
              ethers.constants.AddressZero,
              undefined,
            ],
          },
        ],
      });
      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.cancel.mockResolvedValueOnce(mockTx);

      const mockHMTokenFactoryContract = {
        interface: {
          parseLog: vi.fn(),
        },
      };

      vi.spyOn(HMToken__factory, 'connect').mockReturnValue(
        mockHMTokenFactoryContract as any
      );

      await expect(escrowClient.cancel(escrowAddress)).rejects.toThrow();

      expect(escrowClient.escrowContract.cancel).toHaveBeenCalledWith({});
    });

    test('should successfully cancel escrow with transaction options', async () => {
      const escrowAddress = ethers.constants.AddressZero;
      const amountRefunded = BigNumber.from(1);

      escrowClient.escrowContract.token.mockResolvedValueOnce(
        ethers.constants.AddressZero
      );

      const log = {
        address: ethers.constants.AddressZero,
        name: 'Transfer',
        args: [
          ethers.constants.AddressZero,
          ethers.constants.AddressZero,
          amountRefunded,
        ],
      };
      mockTx.wait.mockResolvedValueOnce({
        transactionHash: FAKE_HASH,
        logs: [log],
      });

      const mockHMTokenFactoryContract = {
        interface: {
          parseLog: vi.fn().mockReturnValueOnce(log),
        },
      };

      vi.spyOn(HMToken__factory, 'connect').mockReturnValue(
        mockHMTokenFactoryContract as any
      );

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.cancel.mockResolvedValueOnce(mockTx);
      const txOptions: Overrides = { gasLimit: 45000 };

      const result = await escrowClient.cancel(escrowAddress, txOptions);

      expect(result).toStrictEqual({
        amountRefunded,
        txHash: FAKE_HASH,
      });
      expect(escrowClient.escrowContract.cancel).toHaveBeenCalledWith(
        txOptions
      );
    });
  });

  describe('abort', () => {
    test('should throw an error if escrowAddress is an invalid address', async () => {
      const invalidAddress = FAKE_ADDRESS;

      await expect(escrowClient.abort(invalidAddress)).rejects.toThrow(
        ErrorInvalidEscrowAddressProvided
      );
    });

    test('should throw an error if hasEscrow returns false', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(escrowClient.abort(escrowAddress)).rejects.toThrow(
        ErrorEscrowAddressIsNotProvidedByFactory
      );
    });

    test('should successfully abort escrow', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      const abortSpy = vi
        .spyOn(escrowClient.escrowContract, 'abort')
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));

      await escrowClient.abort(escrowAddress);

      expect(abortSpy).toHaveBeenCalledWith({});
    });

    test('should throw an error if abort fails', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.abort.mockRejectedValueOnce(new Error());

      await expect(escrowClient.abort(escrowAddress)).rejects.toThrow();

      expect(escrowClient.escrowContract.abort).toHaveBeenCalledWith({});
    });

    test('should successfully abort escrow with transaction options', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      const abortSpy = vi
        .spyOn(escrowClient.escrowContract, 'abort')
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));
      const txOptions: Overrides = { gasLimit: 45000 };

      await escrowClient.abort(escrowAddress, txOptions);

      expect(abortSpy).toHaveBeenCalledWith(txOptions);
    });
  });

  describe('addTrustedHandlers', () => {
    test('should throw an error if escrowAddress is an invalid address', async () => {
      const escrowAddress = FAKE_ADDRESS;
      const trustedHandlers = [ethers.constants.AddressZero];

      await expect(
        escrowClient.addTrustedHandlers(escrowAddress, trustedHandlers)
      ).rejects.toThrow(ErrorInvalidEscrowAddressProvided);
    });

    test('should throw an error if hasEscrow returns false', async () => {
      const escrowAddress = ethers.constants.AddressZero;
      const trustedHandlers = [ethers.constants.AddressZero];

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(
        escrowClient.addTrustedHandlers(escrowAddress, trustedHandlers)
      ).rejects.toThrow(ErrorEscrowAddressIsNotProvidedByFactory);
    });

    test('should throw an error if trusted handlers length is equal to 0', async () => {
      const escrowAddress = ethers.constants.AddressZero;
      const trustedHandlers: string[] = [];

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      await expect(
        escrowClient.addTrustedHandlers(escrowAddress, trustedHandlers)
      ).rejects.toThrow(ErrorListOfHandlersCannotBeEmpty);
    });

    test('should throw an error if trusted handlers contains invalid addresses', async () => {
      const escrowAddress = ethers.constants.AddressZero;
      const trustedHandlers = [FAKE_ADDRESS];

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      await expect(
        escrowClient.addTrustedHandlers(escrowAddress, trustedHandlers)
      ).rejects.toThrow(new InvalidEthereumAddressError(FAKE_ADDRESS));
    });

    test('should successfully addTrustedHandlers', async () => {
      const escrowAddress = ethers.constants.AddressZero;
      const trustedHandlers = [ethers.constants.AddressZero];

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      const addTrustedHandlersSpy = vi
        .spyOn(escrowClient.escrowContract, 'addTrustedHandlers')
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));

      await escrowClient.addTrustedHandlers(escrowAddress, trustedHandlers);

      expect(addTrustedHandlersSpy).toHaveBeenCalledWith(trustedHandlers, {});
    });

    test('should throw an error if addTrustedHandlers fails', async () => {
      const escrowAddress = ethers.constants.AddressZero;
      const trustedHandlers = [ethers.constants.AddressZero];

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.addTrustedHandlers.mockRejectedValueOnce(
        new Error()
      );

      await expect(
        escrowClient.addTrustedHandlers(escrowAddress, trustedHandlers)
      ).rejects.toThrow();

      expect(
        escrowClient.escrowContract.addTrustedHandlers
      ).toHaveBeenCalledWith(trustedHandlers, {});
    });

    test('should successfully addTrustedHandlers with transaction options', async () => {
      const escrowAddress = ethers.constants.AddressZero;
      const trustedHandlers = [ethers.constants.AddressZero];

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      const addTrustedHandlersSpy = vi
        .spyOn(escrowClient.escrowContract, 'addTrustedHandlers')
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));
      const txOptions: Overrides = { gasLimit: 45000 };

      await escrowClient.addTrustedHandlers(
        escrowAddress,
        trustedHandlers,
        txOptions
      );

      expect(addTrustedHandlersSpy).toHaveBeenCalledWith(
        trustedHandlers,
        txOptions
      );
    });
  });

  describe('getBalance', () => {
    test('should throw an error if escrowAddress is an invalid address', async () => {
      const escrowAddress = FAKE_ADDRESS;

      await expect(escrowClient.getBalance(escrowAddress)).rejects.toThrow(
        ErrorInvalidEscrowAddressProvided
      );
    });

    test('should throw an error if hasEscrow returns false', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(escrowClient.getBalance(escrowAddress)).rejects.toThrow(
        ErrorEscrowAddressIsNotProvidedByFactory
      );
    });

    test('should successfully getBalance escrow', async () => {
      const escrowAddress = ethers.constants.AddressZero;
      const amount = BigNumber.from(100);

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.getBalance.mockReturnValue(amount);

      const balance = await escrowClient.getBalance(escrowAddress);

      expect(balance).toEqual(amount);
      expect(escrowClient.escrowContract.getBalance).toHaveBeenCalledWith();
    });

    test('should throw an error if the getBalance fails', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.getBalance.mockRejectedValueOnce(new Error());

      await expect(escrowClient.getBalance(escrowAddress)).rejects.toThrow();

      expect(escrowClient.escrowContract.getBalance).toHaveBeenCalledWith();
    });
  });

  describe('getManifestHash', () => {
    test('should throw an error if escrowAddress is an invalid address', async () => {
      const escrowAddress = FAKE_ADDRESS;

      await expect(escrowClient.getManifestHash(escrowAddress)).rejects.toThrow(
        ErrorInvalidEscrowAddressProvided
      );
    });

    test('should throw an error if hasEscrow returns false', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(escrowClient.getManifestHash(escrowAddress)).rejects.toThrow(
        ErrorEscrowAddressIsNotProvidedByFactory
      );
    });

    test('should successfully getManifestHash', async () => {
      const escrowAddress = ethers.constants.AddressZero;
      const hash = FAKE_HASH;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.manifestHash.mockReturnValue(hash);

      const manifestHash = await escrowClient.getManifestHash(escrowAddress);

      expect(manifestHash).toEqual(hash);
      expect(escrowClient.escrowContract.manifestHash).toHaveBeenCalledWith();
    });

    test('should throw an error if getManifestHash fails', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.manifestHash.mockRejectedValueOnce(
        new Error()
      );

      await expect(
        escrowClient.getManifestHash(escrowAddress)
      ).rejects.toThrow();

      expect(escrowClient.escrowContract.manifestHash).toHaveBeenCalledWith();
    });
  });

  describe('getManifestUrl', () => {
    test('should throw an error if escrowAddress is an invalid address', async () => {
      const escrowAddress = FAKE_ADDRESS;

      await expect(escrowClient.getManifestUrl(escrowAddress)).rejects.toThrow(
        ErrorInvalidEscrowAddressProvided
      );
    });

    test('should throw an error if hasEscrow returns false', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(escrowClient.getManifestUrl(escrowAddress)).rejects.toThrow(
        ErrorEscrowAddressIsNotProvidedByFactory
      );
    });

    test('should successfully getManifestUrl', async () => {
      const escrowAddress = ethers.constants.AddressZero;
      const url = FAKE_URL;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.manifestUrl.mockReturnValue(url);

      const manifestUrl = await escrowClient.getManifestUrl(escrowAddress);

      expect(manifestUrl).toEqual(url);
      expect(escrowClient.escrowContract.manifestUrl).toHaveBeenCalledWith();
    });

    test('should throw an error if getManifestUrl fails', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.manifestUrl.mockRejectedValueOnce(
        new Error()
      );

      await expect(
        escrowClient.getManifestUrl(escrowAddress)
      ).rejects.toThrow();

      expect(escrowClient.escrowContract.manifestUrl).toHaveBeenCalledWith();
    });
  });

  describe('getResultsUrl', () => {
    test('should throw an error if escrowAddress is an invalid address', async () => {
      const escrowAddress = FAKE_ADDRESS;

      await expect(escrowClient.getResultsUrl(escrowAddress)).rejects.toThrow(
        ErrorInvalidEscrowAddressProvided
      );
    });

    test('should throw an error if hasEscrow returns false', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(escrowClient.getResultsUrl(escrowAddress)).rejects.toThrow(
        ErrorEscrowAddressIsNotProvidedByFactory
      );
    });

    test('should successfully getResultsUrl', async () => {
      const escrowAddress = ethers.constants.AddressZero;
      const url = FAKE_URL;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.finalResultsUrl.mockReturnValue(url);

      const finalResultsUrl = await escrowClient.getResultsUrl(escrowAddress);

      expect(finalResultsUrl).toEqual(url);
      expect(
        escrowClient.escrowContract.finalResultsUrl
      ).toHaveBeenCalledWith();
    });

    test('should throw an error if getResultsUrl fails', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.finalResultsUrl.mockRejectedValueOnce(
        new Error()
      );

      await expect(escrowClient.getResultsUrl(escrowAddress)).rejects.toThrow();

      expect(
        escrowClient.escrowContract.finalResultsUrl
      ).toHaveBeenCalledWith();
    });
  });

  describe('getIntermediateResultsUrl', () => {
    test('should throw an error if escrowAddress is an invalid address', async () => {
      const escrowAddress = FAKE_ADDRESS;

      await expect(
        escrowClient.getIntermediateResultsUrl(escrowAddress)
      ).rejects.toThrow(ErrorInvalidEscrowAddressProvided);
    });

    test('should throw an error if hasEscrow returns false', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(
        escrowClient.getIntermediateResultsUrl(escrowAddress)
      ).rejects.toThrow(ErrorEscrowAddressIsNotProvidedByFactory);
    });

    test('should successfully getIntermediateResultsUrl', async () => {
      const escrowAddress = ethers.constants.AddressZero;
      const url = FAKE_URL;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.intermediateResultsUrl.mockReturnValue(url);

      const intermediateResultsUrl =
        await escrowClient.getIntermediateResultsUrl(escrowAddress);

      expect(intermediateResultsUrl).toEqual(url);
      expect(
        escrowClient.escrowContract.intermediateResultsUrl
      ).toHaveBeenCalledWith();
    });

    test('should throw an error if intermediateResultsUrl fails', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.intermediateResultsUrl.mockRejectedValueOnce(
        new Error()
      );

      await expect(
        escrowClient.getIntermediateResultsUrl(escrowAddress)
      ).rejects.toThrow();

      expect(
        escrowClient.escrowContract.intermediateResultsUrl
      ).toHaveBeenCalledWith();
    });
  });

  describe('getTokenAddress', () => {
    test('should throw an error if escrowAddress is an invalid address', async () => {
      const escrowAddress = FAKE_ADDRESS;

      await expect(escrowClient.getTokenAddress(escrowAddress)).rejects.toThrow(
        ErrorInvalidEscrowAddressProvided
      );
    });

    test('should throw an error if hasEscrow returns false', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(escrowClient.getTokenAddress(escrowAddress)).rejects.toThrow(
        ErrorEscrowAddressIsNotProvidedByFactory
      );
    });

    test('should successfully getTokenAddress', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.token.mockReturnValue(
        ethers.constants.AddressZero
      );

      const tokenAddress = await escrowClient.getTokenAddress(escrowAddress);

      expect(tokenAddress).toEqual(ethers.constants.AddressZero);
      expect(escrowClient.escrowContract.token).toHaveBeenCalledWith();
    });

    test('should throw an error if getTokenAddress fails', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.token.mockRejectedValueOnce(new Error());

      await expect(
        escrowClient.getTokenAddress(escrowAddress)
      ).rejects.toThrow();

      expect(escrowClient.escrowContract.token).toHaveBeenCalledWith();
    });
  });

  describe('getStatus', () => {
    test('should throw an error if escrowAddress is an invalid address', async () => {
      const escrowAddress = FAKE_ADDRESS;

      await expect(escrowClient.getStatus(escrowAddress)).rejects.toThrow(
        ErrorInvalidEscrowAddressProvided
      );
    });

    test('should throw an error if hasEscrow returns false', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(escrowClient.getStatus(escrowAddress)).rejects.toThrow(
        ErrorEscrowAddressIsNotProvidedByFactory
      );
    });

    test('should successfully getStatus', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.status.mockReturnValue(EscrowStatus.Complete);

      const status = await escrowClient.getStatus(escrowAddress);

      expect(status).toEqual(EscrowStatus.Complete);
      expect(escrowClient.escrowContract.status).toHaveBeenCalledWith();
    });

    test('should throw an error if getStatus fails', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.status.mockRejectedValueOnce(new Error());

      await expect(escrowClient.getStatus(escrowAddress)).rejects.toThrow();

      expect(escrowClient.escrowContract.status).toHaveBeenCalledWith();
    });
  });

  describe('getRecordingOracleAddress', () => {
    test('should throw an error if escrowAddress is an invalid address', async () => {
      const escrowAddress = FAKE_ADDRESS;

      await expect(
        escrowClient.getRecordingOracleAddress(escrowAddress)
      ).rejects.toThrow(ErrorInvalidEscrowAddressProvided);
    });

    test('should throw an error if hasEscrow returns false', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(
        escrowClient.getRecordingOracleAddress(escrowAddress)
      ).rejects.toThrow(ErrorEscrowAddressIsNotProvidedByFactory);
    });

    test('should successfully getRecordingOracleAddress', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.recordingOracle.mockReturnValue(
        ethers.constants.AddressZero
      );

      const recordingOracleAddress =
        await escrowClient.getRecordingOracleAddress(escrowAddress);

      expect(recordingOracleAddress).toEqual(ethers.constants.AddressZero);
      expect(
        escrowClient.escrowContract.recordingOracle
      ).toHaveBeenCalledWith();
    });

    test('should throw an error if getRecordingOracleAddress fails', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.recordingOracle.mockRejectedValueOnce(
        new Error()
      );

      await expect(
        escrowClient.getRecordingOracleAddress(escrowAddress)
      ).rejects.toThrow();

      expect(
        escrowClient.escrowContract.recordingOracle
      ).toHaveBeenCalledWith();
    });
  });

  describe('getReputationOracleAddress', () => {
    test('should throw an error if escrowAddress is an invalid address', async () => {
      const escrowAddress = FAKE_ADDRESS;

      await expect(
        escrowClient.getReputationOracleAddress(escrowAddress)
      ).rejects.toThrow(ErrorInvalidEscrowAddressProvided);
    });

    test('should throw an error if hasEscrow returns false', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(
        escrowClient.getReputationOracleAddress(escrowAddress)
      ).rejects.toThrow(ErrorEscrowAddressIsNotProvidedByFactory);
    });

    test('should successfully getReputationOracleAddress', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.reputationOracle.mockReturnValue(
        ethers.constants.AddressZero
      );

      const reputationOracleAddress =
        await escrowClient.getReputationOracleAddress(escrowAddress);

      expect(reputationOracleAddress).toEqual(ethers.constants.AddressZero);
      expect(
        escrowClient.escrowContract.reputationOracle
      ).toHaveBeenCalledWith();
    });

    test('should throw an error if getReputationOracleAddress fails', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.reputationOracle.mockRejectedValueOnce(
        new Error()
      );

      await expect(
        escrowClient.getReputationOracleAddress(escrowAddress)
      ).rejects.toThrow();

      expect(
        escrowClient.escrowContract.reputationOracle
      ).toHaveBeenCalledWith();
    });
  });

  describe('getExchangeOracleAddress', () => {
    test('should throw an error if escrowAddress is an invalid address', async () => {
      const escrowAddress = FAKE_ADDRESS;

      await expect(
        escrowClient.getExchangeOracleAddress(escrowAddress)
      ).rejects.toThrow(ErrorInvalidEscrowAddressProvided);
    });

    test('should throw an error if hasEscrow returns false', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(
        escrowClient.getExchangeOracleAddress(escrowAddress)
      ).rejects.toThrow(ErrorEscrowAddressIsNotProvidedByFactory);
    });

    test('should successfully getExchangeOracleAddress', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.exchangeOracle.mockReturnValue(
        ethers.constants.AddressZero
      );

      const exchangeOracleAddress = await escrowClient.getExchangeOracleAddress(
        escrowAddress
      );

      expect(exchangeOracleAddress).toEqual(ethers.constants.AddressZero);
      expect(escrowClient.escrowContract.exchangeOracle).toHaveBeenCalledWith();
    });

    test('should throw an error if getExchangeOracleAddress fails', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.exchangeOracle.mockRejectedValueOnce(
        new Error()
      );

      await expect(
        escrowClient.getExchangeOracleAddress(escrowAddress)
      ).rejects.toThrow();

      expect(escrowClient.escrowContract.exchangeOracle).toHaveBeenCalledWith();
    });
  });

  describe('getJobLauncherAddress', () => {
    test('should throw an error if escrowAddress is an invalid address', async () => {
      const escrowAddress = FAKE_ADDRESS;

      await expect(
        escrowClient.getJobLauncherAddress(escrowAddress)
      ).rejects.toThrow(ErrorInvalidEscrowAddressProvided);
    });

    test('should throw an error if hasEscrow returns false', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(
        escrowClient.getJobLauncherAddress(escrowAddress)
      ).rejects.toThrow(ErrorEscrowAddressIsNotProvidedByFactory);
    });

    test('should successfully get the job launcher address', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.launcher.mockReturnValue(
        ethers.constants.AddressZero
      );

      const jobLauncherAddress = await escrowClient.getJobLauncherAddress(
        escrowAddress
      );

      expect(jobLauncherAddress).toEqual(ethers.constants.AddressZero);
      expect(escrowClient.escrowContract.launcher).toHaveBeenCalledWith();
    });

    test('should throw an error if getJobLauncherAddress fails', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.launcher.mockRejectedValueOnce(new Error());

      await expect(
        escrowClient.getJobLauncherAddress(escrowAddress)
      ).rejects.toThrow();

      expect(escrowClient.escrowContract.launcher).toHaveBeenCalledWith();
    });
  });

  describe('getFactoryAddress', () => {
    test('should throw an error if escrowAddress is an invalid address', async () => {
      const escrowAddress = FAKE_ADDRESS;

      await expect(
        escrowClient.getFactoryAddress(escrowAddress)
      ).rejects.toThrow(ErrorInvalidEscrowAddressProvided);
    });

    test('should throw an error if hasEscrow returns false', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(
        escrowClient.getFactoryAddress(escrowAddress)
      ).rejects.toThrow(ErrorEscrowAddressIsNotProvidedByFactory);
    });

    test('should successfully get the escrow factory address', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.escrowFactory.mockReturnValue(
        ethers.constants.AddressZero
      );

      const escrowFactoryAddress = await escrowClient.getFactoryAddress(
        escrowAddress
      );

      expect(escrowFactoryAddress).toEqual(ethers.constants.AddressZero);
      expect(escrowClient.escrowContract.escrowFactory).toHaveBeenCalledWith();
    });

    test('should throw an error if getFactoryAddress fails', async () => {
      const escrowAddress = ethers.constants.AddressZero;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.escrowFactory.mockRejectedValueOnce(
        new Error()
      );

      await expect(
        escrowClient.getFactoryAddress(escrowAddress)
      ).rejects.toThrow();

      expect(escrowClient.escrowContract.escrowFactory).toHaveBeenCalledWith();
    });
  });
});

describe('EscrowUtils', () => {
  describe('getEscrows', () => {
    test('should throw an error if chainId is empty', async () => {
      await expect(EscrowUtils.getEscrows({ networks: [] })).rejects.toThrow(
        ErrorUnsupportedChainID
      );
    });

    test('should throw an error if chainId is invalid', async () => {
      await expect(
        EscrowUtils.getEscrows({ networks: [123] } as any)
      ).rejects.toThrow(new EthereumError(ErrorUnsupportedChainID.message));
    });
    test('should throw an error if launcher is an invalid address', async () => {
      const launcher = FAKE_ADDRESS;

      await expect(
        EscrowUtils.getEscrows({ networks: [ChainId.POLYGON_MUMBAI], launcher })
      ).rejects.toThrow(ErrorInvalidAddress);
    });

    test('should throw an error if recordingOracle is an invalid address', async () => {
      const recordingOracle = FAKE_ADDRESS;

      await expect(
        EscrowUtils.getEscrows({
          networks: [ChainId.POLYGON_MUMBAI],
          recordingOracle,
        })
      ).rejects.toThrow(ErrorInvalidAddress);
    });

    test('should throw an error if reputationOracle is an invalid address', async () => {
      const reputationOracle = FAKE_ADDRESS;

      await expect(
        EscrowUtils.getEscrows({
          networks: [ChainId.POLYGON_MUMBAI],
          reputationOracle,
        })
      ).rejects.toThrow(ErrorInvalidAddress);
    });

    test('should successfully getEscrows', async () => {
      const escrows = [
        {
          id: '1',
          address: '0x0',
          amountPaid: '3',
          balance: '0',
          count: '1',
          jobRequesterId: '1',
          factoryAddress: '0x0',
          launcher: '0x0',
          status: 'Completed',
          token: '0x0',
          totalFundedAmount: '3',
        },
        {
          id: '2',
          address: '0x0',
          amountPaid: '0',
          balance: '3',
          count: '2',
          jobRequesterId: '1',
          factoryAddress: '0x0',
          launcher: '0x0',
          status: 'Pending',
          token: '0x0',
          totalFundedAmount: '3',
        },
      ];
      const gqlFetchSpy = vi
        .spyOn(gqlFetch, 'default')
        .mockResolvedValue({ escrows });

      const filter = {
        networks: [ChainId.POLYGON_MUMBAI],
      };

      const result = await EscrowUtils.getEscrows(filter);
      expect(result).toEqual(escrows);
      expect(gqlFetchSpy).toHaveBeenCalledWith(
        'https://api.thegraph.com/subgraphs/name/humanprotocol/mumbai-v2',
        GET_ESCROWS_QUERY(filter),
        filter
      );
    });

    test('should successfully getEscrows for the filter', async () => {
      const escrows = [
        {
          id: '1',
          address: '0x0',
          amountPaid: '3',
          balance: '0',
          count: '1',
          jobRequesterId: '1',
          factoryAddress: '0x0',
          launcher: '0x0',
          status: 'Completed',
          token: '0x0',
          totalFundedAmount: '3',
        },
      ];
      const gqlFetchSpy = vi
        .spyOn(gqlFetch, 'default')
        .mockResolvedValue({ escrows });

      const result = await EscrowUtils.getEscrows({
        networks: [ChainId.POLYGON_MUMBAI],
        launcher: ethers.constants.AddressZero,
      });

      expect(result).toEqual(escrows);
      expect(gqlFetchSpy).toHaveBeenCalled();
    });

    test('should successfully getEscrows from two different networks', async () => {
      const polygonEscrow = {
        id: '1',
        address: '0x0',
        amountPaid: '3',
        balance: '0',
        count: '1',
        jobRequesterId: '1',
        factoryAddress: '0x0',
        launcher: '0x0',
        status: 'Completed',
        token: '0x0',
        totalFundedAmount: '3',
      };
      const mumbaiEscrow = {
        id: '2',
        address: '0x0',
        amountPaid: '0',
        balance: '3',
        count: '2',
        jobRequesterId: '1',
        factoryAddress: '0x0',
        launcher: '0x0',
        status: 'Pending',
        token: '0x0',
        totalFundedAmount: '3',
      };
      const gqlFetchSpy = vi
        .spyOn(gqlFetch, 'default')
        .mockImplementation((url) => {
          if (url === NETWORKS[ChainId.POLYGON]?.subgraphUrl) {
            return Promise.resolve({ escrows: [polygonEscrow] });
          } else {
            return Promise.resolve({ escrows: [mumbaiEscrow] });
          }
        });

      const result = await EscrowUtils.getEscrows({
        networks: [ChainId.POLYGON, ChainId.POLYGON_MUMBAI],
      });
      expect(result[0]).toEqual(polygonEscrow);
      expect(result[1]).toEqual(mumbaiEscrow);
      expect(result[0].chainId).toEqual(ChainId.POLYGON);
      expect(result[1].chainId).toEqual(ChainId.POLYGON_MUMBAI);
      expect(gqlFetchSpy).toHaveBeenCalled();
    });

    test('should successfully getEscrows created by a specific job requester', async () => {
      const escrows = [
        {
          id: '1',
          address: '0x0',
          amountPaid: '3',
          balance: '0',
          count: '1',
          jobRequesterId: '1',
          factoryAddress: '0x0',
          launcher: '0x0',
          status: 'Completed',
          token: '0x0',
          totalFundedAmount: '3',
        },
      ];
      const gqlFetchSpy = vi
        .spyOn(gqlFetch, 'default')
        .mockResolvedValue({ escrows });

      const result = await EscrowUtils.getEscrows({
        networks: [ChainId.POLYGON_MUMBAI],
        jobRequesterId: '1',
      });

      expect(result).toEqual(escrows);
      expect(gqlFetchSpy).toHaveBeenCalled();
    });
  });

  describe('getEscrow', () => {
    test('should throw an error if chain id is an unsupported id', async () => {
      const chainId = -1;
      const escrowAddress = ethers.constants.AddressZero;

      await expect(
        EscrowUtils.getEscrow(chainId, escrowAddress)
      ).rejects.toThrow(ErrorUnsupportedChainID);
    });

    test('should throw an error if escrow address is an invalid address', async () => {
      const chainId = ChainId.LOCALHOST;
      const escrowAddress = '0x0';

      await expect(
        EscrowUtils.getEscrow(chainId, escrowAddress)
      ).rejects.toThrow(ErrorInvalidAddress);
    });

    test('should successfully getEscrow for the filter', async () => {
      const chainId = ChainId.LOCALHOST;
      const escrow = {
        id: '1',
        address: ethers.constants.AddressZero,
        amountPaid: '3',
        balance: '0',
        count: '1',
        factoryAddress: '0x0',
        launcher: '0x0',
        status: 'Completed',
        token: '0x0',
        totalFundedAmount: '3',
      };
      const gqlFetchSpy = vi
        .spyOn(gqlFetch, 'default')
        .mockResolvedValue({ escrow });

      const result = await EscrowUtils.getEscrow(
        chainId,
        ethers.constants.AddressZero
      );

      expect(result).toEqual(escrow);
      expect(gqlFetchSpy).toHaveBeenCalledWith(
        '',
        GET_ESCROW_BY_ADDRESS_QUERY(),
        { escrowAddress: escrow.address }
      );
    });
  });
});
