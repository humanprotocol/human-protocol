/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ERC20__factory,
  EscrowFactory__factory,
  Escrow__factory,
  HMToken__factory,
} from '@human-protocol/core/typechain-types';
import { Overrides, ethers } from 'ethers';
import * as gqlFetch from 'graphql-request';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { NETWORKS } from '../src/constants';
import { ChainId, OrderDirection } from '../src/enums';
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
  ErrorSigner,
  ErrorTooManyRecipients,
  ErrorTotalFeeMustBeLessThanHundred,
  ErrorUnsupportedChainID,
  ErrorUrlIsEmptyString,
  InvalidEthereumAddressError,
} from '../src/error';
import { EscrowClient, EscrowUtils } from '../src/escrow';
import {
  GET_ESCROWS_QUERY,
  GET_ESCROW_BY_ADDRESS_QUERY,
  GET_PAYOUTS_QUERY,
} from '../src/graphql';
import { EscrowStatus } from '../src/types';
import {
  DEFAULT_GAS_PAYER_PRIVKEY,
  DEFAULT_TX_ID,
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

describe('EscrowClient', () => {
  let escrowClient: any,
    mockProvider: any,
    mockSigner: any,
    mockEscrowContract: any,
    mockEscrowFactoryContract: any,
    mockTokenContract: any,
    mockTx: any;

  beforeEach(async () => {
    mockProvider = {
      provider: {
        getNetwork: vi.fn().mockResolvedValue({ chainId: ChainId.LOCALHOST }),
      },
    };
    mockSigner = {
      provider: mockProvider.provider,
      getAddress: vi.fn().mockResolvedValue(ethers.ZeroAddress),
      getNonce: vi.fn().mockResolvedValue(0),
      populateTransaction: vi.fn().mockImplementation((tx) => tx),
      signTransaction: vi.fn(),
    };

    mockEscrowContract = {
      createEscrow: vi.fn(),
      setup: vi.fn(),
      fund: vi.fn(),
      storeResults: vi.fn(),
      complete: vi.fn(),
      'bulkPayOut(address[],uint256[],string,string,uint256)': Object.assign(
        vi.fn(),
        {
          populateTransaction: vi.fn(),
        }
      ),
      'bulkPayOut(address[],uint256[],string,string,uint256,bool)':
        Object.assign(vi.fn(), {
          populateTransaction: vi.fn(),
        }),
      cancel: vi.fn(),
      withdraw: vi.fn(),
      addTrustedHandlers: vi.fn(),
      getBalance: vi.fn(),
      remainingFunds: vi.fn(),
      manifestHash: vi.fn(),
      manifestUrl: vi.fn(),
      finalResultsUrl: vi.fn(),
      token: vi.fn(),
      status: vi.fn(),
      getEscrow: vi.fn(),
      getEscrows: vi.fn(),
      address: ethers.ZeroAddress,
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
      const escrowClient = await EscrowClient.build(mockProvider);

      expect(escrowClient).toBeInstanceOf(EscrowClient);
    });

    test('should throw an error if Signer provider does not exist', async () => {
      const signer = new ethers.Wallet(DEFAULT_GAS_PAYER_PRIVKEY);

      await expect(EscrowClient.build(signer)).rejects.toThrow(
        ErrorProviderDoesNotExist
      );
    });

    test('should throw an error if the chain ID is unsupported', async () => {
      const provider = new ethers.JsonRpcProvider();

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
        escrowClient.createEscrow(invalidAddress, [ethers.ZeroAddress])
      ).rejects.toThrow(ErrorInvalidTokenAddress);
    });

    test('should throw an error if trustedHandlers contains an invalid address', async () => {
      await expect(
        escrowClient.createEscrow(ethers.ZeroAddress, [FAKE_ADDRESS])
      ).rejects.toThrow(new InvalidEthereumAddressError(FAKE_ADDRESS));
    });

    test('should create an escrow and return its address', async () => {
      const tokenAddress = ethers.ZeroAddress;
      const trustedHandlers = [ethers.ZeroAddress];
      const jobRequesterId = 'job-requester';
      const expectedEscrowAddress = ethers.ZeroAddress;

      // Create a spy object for the createEscrow method
      const createEscrowSpy = vi
        .spyOn(escrowClient.escrowFactoryContract, 'createEscrow')
        .mockImplementation(() => ({
          wait: async () => ({
            logs: [
              {
                topics: [ethers.id('LaunchedV2(address,address,string)')],
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
      const tokenAddress = ethers.ZeroAddress;
      const trustedHandlers = [ethers.ZeroAddress];
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
      const tokenAddress = ethers.ZeroAddress;
      const trustedHandlers = [ethers.ZeroAddress];
      const jobRequesterId = 'job-requester';
      const expectedEscrowAddress = ethers.ZeroAddress;

      // Create a spy object for the createEscrow method
      const createEscrowSpy = vi
        .spyOn(escrowClient.escrowFactoryContract, 'createEscrow')
        .mockImplementation(() => ({
          wait: async () => ({
            logs: [
              {
                topics: [ethers.id('LaunchedV2(address,address,string)')],
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
        reputationOracle: ethers.ZeroAddress,
        exchangeOracle: ethers.ZeroAddress,
        recordingOracleFee: 10n,
        reputationOracleFee: 10n,
        exchangeOracleFee: 10n,
        manifestUrl: VALID_URL,
        hash: FAKE_HASH,
      };

      await expect(
        escrowClient.setup(ethers.ZeroAddress, escrowConfig)
      ).rejects.toThrow(ErrorInvalidRecordingOracleAddressProvided);
    });

    test('should throw an error if reputationOracle is an invalid address', async () => {
      const escrowConfig = {
        recordingOracle: ethers.ZeroAddress,
        reputationOracle: FAKE_ADDRESS,
        exchangeOracle: ethers.ZeroAddress,
        recordingOracleFee: 10n,
        reputationOracleFee: 10n,
        exchangeOracleFee: 10n,
        manifestUrl: VALID_URL,
        hash: FAKE_HASH,
      };

      await expect(
        escrowClient.setup(ethers.ZeroAddress, escrowConfig)
      ).rejects.toThrow(ErrorInvalidReputationOracleAddressProvided);
    });

    test('should throw an error if exchangeOracle is an invalid address', async () => {
      const escrowConfig = {
        recordingOracle: ethers.ZeroAddress,
        reputationOracle: ethers.ZeroAddress,
        exchangeOracle: FAKE_ADDRESS,
        recordingOracleFee: 10n,
        reputationOracleFee: 10n,
        exchangeOracleFee: 10n,
        manifestUrl: VALID_URL,
        hash: FAKE_HASH,
      };

      await expect(
        escrowClient.setup(ethers.ZeroAddress, escrowConfig)
      ).rejects.toThrow(ErrorInvalidExchangeOracleAddressProvided);
    });

    test('should throw an error if escrowAddress is an invalid address', async () => {
      const escrowConfig = {
        recordingOracle: ethers.ZeroAddress,
        reputationOracle: ethers.ZeroAddress,
        exchangeOracle: ethers.ZeroAddress,
        recordingOracleFee: 10n,
        reputationOracleFee: 10n,
        exchangeOracleFee: 10n,
        manifestUrl: VALID_URL,
        hash: FAKE_HASH,
      };

      await expect(
        escrowClient.setup(FAKE_ADDRESS, escrowConfig)
      ).rejects.toThrow(ErrorInvalidEscrowAddressProvided);
    });

    test('should throw an error if hasEscrow returns false', async () => {
      const escrowConfig = {
        recordingOracle: ethers.ZeroAddress,
        reputationOracle: ethers.ZeroAddress,
        exchangeOracle: ethers.ZeroAddress,
        recordingOracleFee: 10n,
        reputationOracleFee: 10n,
        exchangeOracleFee: 10n,
        manifestUrl: VALID_URL,
        manifestHash: FAKE_HASH,
      };

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(
        escrowClient.setup(ethers.ZeroAddress, escrowConfig)
      ).rejects.toThrow(ErrorEscrowAddressIsNotProvidedByFactory);
    });

    test('should throw an error if 0 <= recordingOracleFee', async () => {
      const escrowConfig = {
        recordingOracle: ethers.ZeroAddress,
        reputationOracle: ethers.ZeroAddress,
        exchangeOracle: ethers.ZeroAddress,
        recordingOracleFee: 0n,
        reputationOracleFee: 10n,
        exchangeOracleFee: 10n,
        manifestUrl: VALID_URL,
        hash: FAKE_HASH,
      };

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      await expect(
        escrowClient.setup(ethers.ZeroAddress, escrowConfig)
      ).rejects.toThrow(ErrorAmountMustBeGreaterThanZero);
    });

    test('should throw an error if 0 <= reputationOracleFee', async () => {
      const escrowConfig = {
        recordingOracle: ethers.ZeroAddress,
        reputationOracle: ethers.ZeroAddress,
        exchangeOracle: ethers.ZeroAddress,
        recordingOracleFee: 10n,
        reputationOracleFee: 0n,
        exchangeOracleFee: 10n,
        manifestUrl: VALID_URL,
        hash: FAKE_HASH,
      };

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      await expect(
        escrowClient.setup(ethers.ZeroAddress, escrowConfig)
      ).rejects.toThrow(ErrorAmountMustBeGreaterThanZero);
    });

    test('should throw an error if 0 <= exchangeOracleFee', async () => {
      const escrowConfig = {
        recordingOracle: ethers.ZeroAddress,
        reputationOracle: ethers.ZeroAddress,
        exchangeOracle: ethers.ZeroAddress,
        recordingOracleFee: 10n,
        reputationOracleFee: 10n,
        exchangeOracleFee: 0n,
        manifestUrl: VALID_URL,
        hash: FAKE_HASH,
      };

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      await expect(
        escrowClient.setup(ethers.ZeroAddress, escrowConfig)
      ).rejects.toThrow(ErrorAmountMustBeGreaterThanZero);
    });

    test('should throw an error if total fee is greater than 100', async () => {
      const escrowConfig = {
        recordingOracle: ethers.ZeroAddress,
        reputationOracle: ethers.ZeroAddress,
        exchangeOracle: ethers.ZeroAddress,
        recordingOracleFee: 40n,
        reputationOracleFee: 40n,
        exchangeOracleFee: 40n,
        manifestUrl: VALID_URL,
        hash: FAKE_HASH,
      };

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      await expect(
        escrowClient.setup(ethers.ZeroAddress, escrowConfig)
      ).rejects.toThrow(ErrorTotalFeeMustBeLessThanHundred);
    });

    test('should throw an error if manifestUrl is an empty string', async () => {
      const escrowConfig = {
        recordingOracle: ethers.ZeroAddress,
        reputationOracle: ethers.ZeroAddress,
        exchangeOracle: ethers.ZeroAddress,
        recordingOracleFee: 10n,
        reputationOracleFee: 10n,
        exchangeOracleFee: 10n,
        manifestUrl: '',
        hash: FAKE_HASH,
      };

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      await expect(
        escrowClient.setup(ethers.ZeroAddress, escrowConfig)
      ).rejects.toThrow(ErrorUrlIsEmptyString);
    });

    test('should throw an error if manifestUrl is an invalid url', async () => {
      const escrowConfig = {
        recordingOracle: ethers.ZeroAddress,
        reputationOracle: ethers.ZeroAddress,
        exchangeOracle: ethers.ZeroAddress,
        recordingOracleFee: 10n,
        reputationOracleFee: 10n,
        exchangeOracleFee: 10n,
        manifestUrl: FAKE_URL,
        hash: FAKE_HASH,
      };

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      await expect(
        escrowClient.setup(ethers.ZeroAddress, escrowConfig)
      ).rejects.toThrow(ErrorInvalidUrl);
    });

    test('should throw an error if hash is an empty string', async () => {
      const escrowConfig = {
        recordingOracle: ethers.ZeroAddress,
        reputationOracle: ethers.ZeroAddress,
        exchangeOracle: ethers.ZeroAddress,
        recordingOracleFee: 10n,
        reputationOracleFee: 10n,
        exchangeOracleFee: 10n,
        manifestUrl: VALID_URL,
        hash: '',
      };

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      await expect(
        escrowClient.setup(ethers.ZeroAddress, escrowConfig)
      ).rejects.toThrow(ErrorHashIsEmptyString);
    });

    test('should successfully setup escrow', async () => {
      const escrowConfig = {
        recordingOracle: ethers.ZeroAddress,
        reputationOracle: ethers.ZeroAddress,
        exchangeOracle: ethers.ZeroAddress,
        recordingOracleFee: 10n,
        reputationOracleFee: 10n,
        exchangeOracleFee: 10n,
        manifestUrl: VALID_URL,
        manifestHash: FAKE_HASH,
      };

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      const setupSpy = vi
        .spyOn(escrowClient.escrowContract, 'setup')
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));

      await escrowClient.setup(ethers.ZeroAddress, escrowConfig);

      expect(setupSpy).toHaveBeenCalledWith(
        ethers.ZeroAddress,
        ethers.ZeroAddress,
        ethers.ZeroAddress,
        10n,
        10n,
        10n,
        VALID_URL,
        FAKE_HASH,
        {}
      );
    });

    test('should throw an error if setup escrow fails', async () => {
      const escrowConfig = {
        recordingOracle: ethers.ZeroAddress,
        reputationOracle: ethers.ZeroAddress,
        exchangeOracle: ethers.ZeroAddress,
        recordingOracleFee: 10n,
        reputationOracleFee: 10n,
        exchangeOracleFee: 10n,
        manifestUrl: VALID_URL,
        manifestHash: FAKE_HASH,
      };

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.setup.mockRejectedValueOnce(new Error());

      await expect(
        escrowClient.setup(ethers.ZeroAddress, escrowConfig)
      ).rejects.toThrow();

      expect(escrowClient.escrowContract.setup).toHaveBeenCalledWith(
        ethers.ZeroAddress,
        ethers.ZeroAddress,
        ethers.ZeroAddress,
        10n,
        10n,
        10n,
        VALID_URL,
        FAKE_HASH,
        {}
      );
    });

    test('should successfully setup escrow with transaction options', async () => {
      const escrowConfig = {
        recordingOracle: ethers.ZeroAddress,
        reputationOracle: ethers.ZeroAddress,
        exchangeOracle: ethers.ZeroAddress,
        recordingOracleFee: 10n,
        reputationOracleFee: 10n,
        exchangeOracleFee: 10n,
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

      await escrowClient.setup(ethers.ZeroAddress, escrowConfig, txOptions);

      expect(setupSpy).toHaveBeenCalledWith(
        ethers.ZeroAddress,
        ethers.ZeroAddress,
        ethers.ZeroAddress,
        10n,
        10n,
        10n,
        VALID_URL,
        FAKE_HASH,
        txOptions
      );
    });
  });

  describe('fund', () => {
    test('should throw an error if escrowAddress is an invalid address', async () => {
      const invalidAddress = FAKE_ADDRESS;
      const amount = 10n;

      await expect(escrowClient.fund(invalidAddress, amount)).rejects.toThrow(
        ErrorInvalidEscrowAddressProvided
      );
    });

    test('should throw an error if hasEscrow returns false', async () => {
      const escrowAddress = ethers.ZeroAddress;
      const amount = 10n;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(escrowClient.fund(escrowAddress, amount)).rejects.toThrow(
        ErrorEscrowAddressIsNotProvidedByFactory
      );
    });

    test('should throw an error if 0 <= amount', async () => {
      const escrowAddress = ethers.ZeroAddress;
      const invalidAmount = 0n;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      await expect(
        escrowClient.fund(escrowAddress, invalidAmount)
      ).rejects.toThrow(ErrorAmountMustBeGreaterThanZero);
    });

    test('should successfully fund escrow', async () => {
      const tokenAddress = ethers.ZeroAddress;
      const escrowAddress = ethers.ZeroAddress;
      const amount = 10n;

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
      const tokenAddress = ethers.ZeroAddress;
      const escrowAddress = ethers.ZeroAddress;
      const amount = 10n;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.token.mockReturnValue(tokenAddress);
      escrowClient.tokenContract.transfer.mockRejectedValueOnce(new Error());

      await expect(escrowClient.fund(escrowAddress, amount)).rejects.toThrow();

      expect(escrowClient.escrowContract.token).toHaveBeenCalledWith();
    });

    test('should successfully fund escrow with transaction options', async () => {
      const tokenAddress = ethers.ZeroAddress;
      const escrowAddress = ethers.ZeroAddress;
      const amount = 10n;

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
      const escrowAddress = ethers.ZeroAddress;
      const url = VALID_URL;
      const hash = FAKE_HASH;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(
        escrowClient.storeResults(escrowAddress, url, hash)
      ).rejects.toThrow(ErrorEscrowAddressIsNotProvidedByFactory);
    });

    test('should throw an error if url is an empty string', async () => {
      const escrowAddress = ethers.ZeroAddress;
      const url = '';
      const hash = FAKE_HASH;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      await expect(
        escrowClient.storeResults(escrowAddress, url, hash)
      ).rejects.toThrow(ErrorUrlIsEmptyString);
    });

    test('should throw an error if results url is invalid url', async () => {
      const escrowAddress = ethers.ZeroAddress;
      const url = FAKE_URL;
      const hash = FAKE_HASH;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      await expect(
        escrowClient.storeResults(escrowAddress, url, hash)
      ).rejects.toThrow(ErrorInvalidUrl);
    });

    test('should throw an error if hash is an empty string', async () => {
      const escrowAddress = ethers.ZeroAddress;
      const url = VALID_URL;
      const hash = '';

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      await expect(
        escrowClient.storeResults(escrowAddress, url, hash)
      ).rejects.toThrow(ErrorHashIsEmptyString);
    });

    test('should successfully store results', async () => {
      const escrowAddress = ethers.ZeroAddress;
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
      const escrowAddress = ethers.ZeroAddress;
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
      const escrowAddress = ethers.ZeroAddress;
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
      const escrowAddress = ethers.ZeroAddress;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(escrowClient.complete(escrowAddress)).rejects.toThrow(
        ErrorEscrowAddressIsNotProvidedByFactory
      );
    });

    test('should successfully complete escrow', async () => {
      const escrowAddress = ethers.ZeroAddress;

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
      const escrowAddress = ethers.ZeroAddress;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.complete.mockRejectedValueOnce(new Error());

      await expect(escrowClient.complete(escrowAddress)).rejects.toThrow();

      expect(escrowClient.escrowContract.complete).toHaveBeenCalledWith({});
    });

    test('should successfully complete escrow with transaction options', async () => {
      const escrowAddress = ethers.ZeroAddress;

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
      const recipients = [ethers.ZeroAddress];
      const amounts = [100n];
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
      const escrowAddress = ethers.ZeroAddress;
      const recipients = [ethers.ZeroAddress];
      const amounts = [100n];
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
      const escrowAddress = ethers.ZeroAddress;
      const recipients: string[] = [];
      const amounts = [100n];
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

    test('should throw an error if too many recipients', async () => {
      const escrowAddress = ethers.ZeroAddress;
      const recipients = Array.from({ length: 100 }, () => ethers.ZeroAddress);
      const amounts = recipients.map(() => 100n);
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
      ).rejects.toThrow(ErrorTooManyRecipients);
    });

    test('should throw an error if amounts length is equal to 0', async () => {
      const escrowAddress = ethers.ZeroAddress;
      const recipients = [ethers.ZeroAddress];
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
      const escrowAddress = ethers.ZeroAddress;
      const recipients = [ethers.ZeroAddress];
      const amounts = [100n, 100n, 100n];
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
      const escrowAddress = ethers.ZeroAddress;
      const recipients = [FAKE_ADDRESS];
      const amounts = [100n];
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
      const escrowAddress = ethers.ZeroAddress;
      const recipients = [ethers.ZeroAddress];
      const amounts = [100n];
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
      const escrowAddress = ethers.ZeroAddress;
      const recipients = [ethers.ZeroAddress];
      const amounts = [100n];
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
      const escrowAddress = ethers.ZeroAddress;
      const recipients = [ethers.ZeroAddress];
      const amounts = [100n];
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
      const escrowAddress = ethers.ZeroAddress;
      const recipients = [ethers.ZeroAddress, ethers.ZeroAddress];
      const amounts = [90n, 20n];
      const finalResultsUrl = VALID_URL;
      const finalResultsHash = FAKE_HASH;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.getBalance = vi.fn().mockReturnValue(50n);

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
      const escrowAddress = ethers.ZeroAddress;
      const recipients = [ethers.ZeroAddress, ethers.ZeroAddress];
      const amounts = [10n, 10n];
      const finalResultsUrl = VALID_URL;
      const finalResultsHash = FAKE_HASH;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      const bulkPayOutSpy = vi
        .spyOn(
          escrowClient.escrowContract,
          'bulkPayOut(address[],uint256[],string,string,uint256)'
        )
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));

      await escrowClient.bulkPayOut(
        escrowAddress,
        recipients,
        amounts,
        finalResultsUrl,
        finalResultsHash,
        DEFAULT_TX_ID
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

    test('should successfully bulkPayOut escrow with forceComplete option', async () => {
      const escrowAddress = ethers.ZeroAddress;
      const recipients = [ethers.ZeroAddress, ethers.ZeroAddress];
      const amounts = [10n, 10n];
      const finalResultsUrl = VALID_URL;
      const finalResultsHash = FAKE_HASH;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      const bulkPayOutSpy = vi
        .spyOn(
          escrowClient.escrowContract,
          'bulkPayOut(address[],uint256[],string,string,uint256,bool)'
        )
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));

      await escrowClient.bulkPayOut(
        escrowAddress,
        recipients,
        amounts,
        finalResultsUrl,
        finalResultsHash,
        DEFAULT_TX_ID,
        true
      );

      expect(bulkPayOutSpy).toHaveBeenCalledWith(
        recipients,
        amounts,
        finalResultsUrl,
        finalResultsHash,
        DEFAULT_TX_ID,
        true,
        {}
      );
    });

    test('should successfully bulkPayOut escrow with transaction options', async () => {
      const escrowAddress = ethers.ZeroAddress;
      const recipients = [ethers.ZeroAddress, ethers.ZeroAddress];
      const amounts = [10n, 10n];
      const finalResultsUrl = VALID_URL;
      const finalResultsHash = FAKE_HASH;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.getBalance = vi.fn().mockReturnValue(100n);

      const bulkPayOutSpy = vi
        .spyOn(
          escrowClient.escrowContract,
          'bulkPayOut(address[],uint256[],string,string,uint256)'
        )
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
        DEFAULT_TX_ID,
        false,
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

  describe('createBulkPayoutTransaction', () => {
    beforeEach(() => {
      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
    });

    test('should require signer', async () => {
      const originalGetAddress = mockSigner.getAddress;
      delete mockSigner.getAddress;

      const escrowAddress = ethers.ZeroAddress;
      const recipients = [ethers.ZeroAddress, ethers.ZeroAddress];
      const amounts = [90n, 20n];
      const finalResultsUrl = VALID_URL;
      const finalResultsHash = FAKE_HASH;

      let thrownError;
      try {
        await escrowClient.createBulkPayoutTransaction(
          escrowAddress,
          recipients,
          amounts,
          finalResultsUrl,
          finalResultsHash
        );
      } catch (error) {
        thrownError = error;
      }
      expect(thrownError).toBe(ErrorSigner);

      mockSigner.getAddress = originalGetAddress;
    });

    test('should throw an error if escrowAddress is an invalid address', async () => {
      const invalidAddress = FAKE_ADDRESS;
      const recipients = [ethers.ZeroAddress];
      const amounts = [100n];
      const finalResultsUrl = VALID_URL;
      const finalResultsHash = FAKE_HASH;

      await expect(
        escrowClient.createBulkPayoutTransaction(
          invalidAddress,
          recipients,
          amounts,
          finalResultsUrl,
          finalResultsHash
        )
      ).rejects.toThrow(ErrorInvalidEscrowAddressProvided);
    });

    test('should throw an error if recipients length is equal to 0', async () => {
      const escrowAddress = ethers.ZeroAddress;
      const recipients: string[] = [];
      const amounts = [100n];
      const finalResultsUrl = VALID_URL;
      const finalResultsHash = FAKE_HASH;

      await expect(
        escrowClient.createBulkPayoutTransaction(
          escrowAddress,
          recipients,
          amounts,
          finalResultsUrl,
          finalResultsHash
        )
      ).rejects.toThrow(ErrorRecipientCannotBeEmptyArray);
    });

    test('should throw an error if too many recipients', async () => {
      const escrowAddress = ethers.ZeroAddress;
      const recipients = Array.from({ length: 100 }, () => ethers.ZeroAddress);
      const amounts = recipients.map(() => 100n);
      const finalResultsUrl = VALID_URL;
      const finalResultsHash = FAKE_HASH;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      await expect(
        escrowClient.createBulkPayoutTransaction(
          escrowAddress,
          recipients,
          amounts,
          finalResultsUrl,
          finalResultsHash
        )
      ).rejects.toThrow(ErrorTooManyRecipients);
    });

    test('should throw an error if amounts length is equal to 0', async () => {
      const escrowAddress = ethers.ZeroAddress;
      const recipients = [ethers.ZeroAddress];
      const amounts: number[] = [];
      const finalResultsUrl = VALID_URL;
      const finalResultsHash = FAKE_HASH;

      await expect(
        escrowClient.createBulkPayoutTransaction(
          escrowAddress,
          recipients,
          amounts,
          finalResultsUrl,
          finalResultsHash
        )
      ).rejects.toThrow(ErrorAmountsCannotBeEmptyArray);
    });

    test('should throw an error if recipients and amounts do not have the same length', async () => {
      const escrowAddress = ethers.ZeroAddress;
      const recipients = [ethers.ZeroAddress];
      const amounts = [100n, 100n];
      const finalResultsUrl = VALID_URL;
      const finalResultsHash = FAKE_HASH;

      await expect(
        escrowClient.createBulkPayoutTransaction(
          escrowAddress,
          recipients,
          amounts,
          finalResultsUrl,
          finalResultsHash
        )
      ).rejects.toThrow(ErrorRecipientAndAmountsMustBeSameLength);
    });

    test('should throw an error if url is an empty string', async () => {
      const escrowAddress = ethers.ZeroAddress;
      const recipients = [ethers.ZeroAddress];
      const amounts = [100n];
      const finalResultsUrl = '';
      const finalResultsHash = FAKE_HASH;

      await expect(
        escrowClient.createBulkPayoutTransaction(
          escrowAddress,
          recipients,
          amounts,
          finalResultsUrl,
          finalResultsHash
        )
      ).rejects.toThrow(ErrorUrlIsEmptyString);
    });

    test('should throw an error if final results url is an invalid url', async () => {
      const escrowAddress = ethers.ZeroAddress;
      const recipients = [ethers.ZeroAddress];
      const amounts = [100n];
      const finalResultsUrl = FAKE_URL;
      const finalResultsHash = FAKE_HASH;

      await expect(
        escrowClient.createBulkPayoutTransaction(
          escrowAddress,
          recipients,
          amounts,
          finalResultsUrl,
          finalResultsHash
        )
      ).rejects.toThrow(ErrorInvalidUrl);
    });

    test('should throw an error if hash is an empty string', async () => {
      const escrowAddress = ethers.ZeroAddress;
      const recipients = [ethers.ZeroAddress];
      const amounts = [100n];
      const finalResultsUrl = VALID_URL;
      const finalResultsHash = '';

      await expect(
        escrowClient.createBulkPayoutTransaction(
          escrowAddress,
          recipients,
          amounts,
          finalResultsUrl,
          finalResultsHash
        )
      ).rejects.toThrow(ErrorHashIsEmptyString);
    });

    test('should throw an error if recipients contains invalid addresses', async () => {
      const escrowAddress = ethers.ZeroAddress;
      const recipients = [FAKE_ADDRESS];
      const amounts = [100n];
      const finalResultsUrl = VALID_URL;
      const finalResultsHash = FAKE_HASH;

      await expect(
        escrowClient.createBulkPayoutTransaction(
          escrowAddress,
          recipients,
          amounts,
          finalResultsUrl,
          finalResultsHash
        )
      ).rejects.toThrow(new InvalidEthereumAddressError(FAKE_ADDRESS));
    });

    test('should throw an error if hasEscrow returns false', async () => {
      const escrowAddress = ethers.ZeroAddress;
      const recipients = [ethers.ZeroAddress];
      const amounts = [100n];
      const finalResultsUrl = VALID_URL;
      const finalResultsHash = FAKE_HASH;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValueOnce(false);

      await expect(
        escrowClient.createBulkPayoutTransaction(
          escrowAddress,
          recipients,
          amounts,
          finalResultsUrl,
          finalResultsHash
        )
      ).rejects.toThrow(ErrorEscrowAddressIsNotProvidedByFactory);
    });

    test('should throw an error if escrow does not have enough balance', async () => {
      const escrowAddress = ethers.ZeroAddress;
      const recipients = [ethers.ZeroAddress, ethers.ZeroAddress];
      const amounts = [90n, 20n];
      const finalResultsUrl = VALID_URL;
      const finalResultsHash = FAKE_HASH;

      escrowClient.getBalance = vi.fn().mockReturnValue(50n);

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

    test('should create raw transaction for bulk payout with nonce of signer', async () => {
      const escrowAddress = ethers.ZeroAddress;
      const recipients = [ethers.ZeroAddress, ethers.ZeroAddress];
      const amounts = [10n, 10n];
      const finalResultsUrl = VALID_URL;
      const finalResultsHash = FAKE_HASH;
      const signerAddress = ethers.ZeroAddress;
      const encodedMethodData = '0xbulkPayOut-call-encoded-data';

      escrowClient.escrowContract[
        'bulkPayOut(address[],uint256[],string,string,uint256,bool)'
      ].populateTransaction.mockResolvedValueOnce({
        from: signerAddress,
        to: escrowAddress,
        data: encodedMethodData,
      });

      const signedTransaction = '0x123456';
      mockSigner.signTransaction.mockResolvedValueOnce(signedTransaction);

      const rawTransaction = await escrowClient.createBulkPayoutTransaction(
        escrowAddress,
        recipients,
        amounts,
        finalResultsUrl,
        finalResultsHash,
        DEFAULT_TX_ID,
        false
      );

      expect(rawTransaction).toEqual({
        from: signerAddress,
        to: escrowAddress,
        data: encodedMethodData,
        nonce: 0,
      });
    });

    test('should create raw transaction for bulk payout with passed nonce', async () => {
      const escrowAddress = ethers.ZeroAddress;
      const recipients = [ethers.ZeroAddress, ethers.ZeroAddress];
      const amounts = [10n, 10n];
      const finalResultsUrl = VALID_URL;
      const finalResultsHash = FAKE_HASH;
      const signerAddress = ethers.ZeroAddress;
      const encodedMethodData = '0xbulkPayOut-call-encoded-data';

      escrowClient.escrowContract[
        'bulkPayOut(address[],uint256[],string,string,uint256,bool)'
      ].populateTransaction.mockResolvedValueOnce({
        from: signerAddress,
        to: escrowAddress,
        data: encodedMethodData,
      });

      mockSigner.signTransaction.mockResolvedValueOnce('0x123456');

      const nonce = 42;
      const rawTransaction = await escrowClient.createBulkPayoutTransaction(
        escrowAddress,
        recipients,
        amounts,
        finalResultsUrl,
        finalResultsHash,
        DEFAULT_TX_ID,
        false,
        {
          nonce,
        }
      );

      expect(rawTransaction).toEqual({
        from: signerAddress,
        to: escrowAddress,
        data: encodedMethodData,
        nonce,
      });
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
      const escrowAddress = ethers.ZeroAddress;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(escrowClient.cancel(escrowAddress)).rejects.toThrow(
        ErrorEscrowAddressIsNotProvidedByFactory
      );
    });

    test('should successfully cancel escrow', async () => {
      const escrowAddress = ethers.ZeroAddress;
      const amountRefunded = 1n;

      escrowClient.escrowContract.token.mockResolvedValueOnce(
        ethers.ZeroAddress
      );

      const log = {
        address: ethers.ZeroAddress,
        name: 'Transfer',
        args: [ethers.ZeroAddress, ethers.ZeroAddress, amountRefunded],
      };
      mockTx.wait.mockResolvedValueOnce({
        hash: FAKE_HASH,
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
      const escrowAddress = ethers.ZeroAddress;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.cancel.mockRejectedValueOnce(new Error());

      await expect(escrowClient.cancel(escrowAddress)).rejects.toThrow();

      expect(escrowClient.escrowContract.cancel).toHaveBeenCalledWith({});
    });

    test('should throw an error if the wait fails', async () => {
      const escrowAddress = ethers.ZeroAddress;
      mockTx.wait.mockRejectedValueOnce(new Error());
      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.cancel.mockResolvedValueOnce(mockTx);

      await expect(escrowClient.cancel(escrowAddress)).rejects.toThrow();

      expect(escrowClient.escrowContract.cancel).toHaveBeenCalledWith({});
    });

    test('should throw an error if transfer event not found in transaction logs', async () => {
      const escrowAddress = ethers.ZeroAddress;
      mockTx.wait.mockResolvedValueOnce({
        transactionHash: FAKE_HASH,
        logs: [
          {
            address: ethers.ZeroAddress,
            name: 'NotTransfer',
            args: [ethers.ZeroAddress, ethers.ZeroAddress, undefined],
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
      const escrowAddress = ethers.ZeroAddress;
      const amountRefunded = 1n;

      escrowClient.escrowContract.token.mockResolvedValueOnce(
        ethers.ZeroAddress
      );

      const log = {
        address: ethers.ZeroAddress,
        name: 'Transfer',
        args: [ethers.ZeroAddress, ethers.ZeroAddress, amountRefunded],
      };
      mockTx.wait.mockResolvedValueOnce({
        hash: FAKE_HASH,
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

  describe('addTrustedHandlers', () => {
    test('should throw an error if escrowAddress is an invalid address', async () => {
      const escrowAddress = FAKE_ADDRESS;
      const trustedHandlers = [ethers.ZeroAddress];

      await expect(
        escrowClient.addTrustedHandlers(escrowAddress, trustedHandlers)
      ).rejects.toThrow(ErrorInvalidEscrowAddressProvided);
    });

    test('should throw an error if hasEscrow returns false', async () => {
      const escrowAddress = ethers.ZeroAddress;
      const trustedHandlers = [ethers.ZeroAddress];

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(
        escrowClient.addTrustedHandlers(escrowAddress, trustedHandlers)
      ).rejects.toThrow(ErrorEscrowAddressIsNotProvidedByFactory);
    });

    test('should throw an error if trusted handlers length is equal to 0', async () => {
      const escrowAddress = ethers.ZeroAddress;
      const trustedHandlers: string[] = [];

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      await expect(
        escrowClient.addTrustedHandlers(escrowAddress, trustedHandlers)
      ).rejects.toThrow(ErrorListOfHandlersCannotBeEmpty);
    });

    test('should throw an error if trusted handlers contains invalid addresses', async () => {
      const escrowAddress = ethers.ZeroAddress;
      const trustedHandlers = [FAKE_ADDRESS];

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);

      await expect(
        escrowClient.addTrustedHandlers(escrowAddress, trustedHandlers)
      ).rejects.toThrow(new InvalidEthereumAddressError(FAKE_ADDRESS));
    });

    test('should successfully addTrustedHandlers', async () => {
      const escrowAddress = ethers.ZeroAddress;
      const trustedHandlers = [ethers.ZeroAddress];

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
      const escrowAddress = ethers.ZeroAddress;
      const trustedHandlers = [ethers.ZeroAddress];

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
      const escrowAddress = ethers.ZeroAddress;
      const trustedHandlers = [ethers.ZeroAddress];

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

  describe('withdraw', () => {
    const escrowAddress = ethers.ZeroAddress;
    const tokenAddress = ethers.ZeroAddress;

    test('should throw an error if escrowAddress is an invalid address', async () => {
      const invalidEscrowAddress = FAKE_ADDRESS;

      await expect(
        escrowClient.withdraw(invalidEscrowAddress, tokenAddress)
      ).rejects.toThrow(ErrorInvalidEscrowAddressProvided);
    });

    test('should throw an error if tokenAddress is an invalid address', async () => {
      const invalidTokenAddress = FAKE_ADDRESS;

      await expect(
        escrowClient.withdraw(escrowAddress, invalidTokenAddress)
      ).rejects.toThrow(ErrorInvalidTokenAddress);
    });

    test('should throw an error if hasEscrow returns false', async () => {
      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(
        escrowClient.withdraw(escrowAddress, tokenAddress)
      ).rejects.toThrow(ErrorEscrowAddressIsNotProvidedByFactory);
    });

    test('should successfully withdraw from escrow', async () => {
      const amountWithdrawn = 1n;

      const log = {
        address: ethers.ZeroAddress,
        name: 'Transfer',
        args: [ethers.ZeroAddress, ethers.ZeroAddress, amountWithdrawn],
      };
      mockTx.wait.mockResolvedValueOnce({
        hash: FAKE_HASH,
        logs: [log],
      });

      const mockERC20FactoryContract = {
        interface: {
          parseLog: vi.fn().mockReturnValueOnce(log),
        },
      };

      vi.spyOn(ERC20__factory, 'connect').mockReturnValue(
        mockERC20FactoryContract as any
      );

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.withdraw.mockResolvedValueOnce(mockTx);

      const result = await escrowClient.withdraw(escrowAddress, tokenAddress);

      expect(result).toStrictEqual({
        amountWithdrawn,
        tokenAddress,
        txHash: FAKE_HASH,
      });
      expect(escrowClient.escrowContract.withdraw).toHaveBeenCalledWith(
        tokenAddress,
        {}
      );
    });

    test('should throw an error if the withdraw fails', async () => {
      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.withdraw.mockRejectedValueOnce(new Error());

      await expect(
        escrowClient.withdraw(escrowAddress, tokenAddress)
      ).rejects.toThrow();

      expect(escrowClient.escrowContract.withdraw).toHaveBeenCalledWith(
        tokenAddress,
        {}
      );
    });

    test('should throw an error if the wait fails', async () => {
      mockTx.wait.mockRejectedValueOnce(new Error());
      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.withdraw.mockResolvedValueOnce(mockTx);

      await expect(
        escrowClient.withdraw(escrowAddress, tokenAddress)
      ).rejects.toThrow();

      expect(escrowClient.escrowContract.withdraw).toHaveBeenCalledWith(
        tokenAddress,
        {}
      );
    });

    test('should throw an error if transfer event not found in transaction logs', async () => {
      const escrowAddress = ethers.ZeroAddress;
      mockTx.wait.mockResolvedValueOnce({
        transactionHash: FAKE_HASH,
        logs: [
          {
            address: ethers.ZeroAddress,
            name: 'NotTransfer',
            args: [ethers.ZeroAddress, ethers.ZeroAddress, undefined],
          },
        ],
      });
      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.withdraw.mockResolvedValueOnce(mockTx);

      const mockERC20FactoryContract = {
        interface: {
          parseLog: vi.fn(),
        },
      };

      vi.spyOn(ERC20__factory, 'connect').mockReturnValue(
        mockERC20FactoryContract as any
      );

      await expect(
        escrowClient.withdraw(escrowAddress, tokenAddress)
      ).rejects.toThrow();

      expect(escrowClient.escrowContract.withdraw).toHaveBeenCalledWith(
        tokenAddress,
        {}
      );
    });

    test('should successfully withdraw from escrow with transaction options', async () => {
      const escrowAddress = ethers.ZeroAddress;
      const amountWithdrawn = 1n;

      const log = {
        address: ethers.ZeroAddress,
        name: 'Transfer',
        args: [ethers.ZeroAddress, ethers.ZeroAddress, amountWithdrawn],
      };
      mockTx.wait.mockResolvedValueOnce({
        hash: FAKE_HASH,
        logs: [log],
      });

      const mockERC20FactoryContract = {
        interface: {
          parseLog: vi.fn().mockReturnValueOnce(log),
        },
      };

      vi.spyOn(ERC20__factory, 'connect').mockReturnValue(
        mockERC20FactoryContract as any
      );

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.withdraw.mockResolvedValueOnce(mockTx);
      const txOptions: Overrides = { gasLimit: 45000 };

      const result = await escrowClient.withdraw(
        escrowAddress,
        tokenAddress,
        txOptions
      );

      expect(result).toStrictEqual({
        amountWithdrawn,
        tokenAddress,
        txHash: FAKE_HASH,
      });
      expect(escrowClient.escrowContract.withdraw).toHaveBeenCalledWith(
        tokenAddress,
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
      const escrowAddress = ethers.ZeroAddress;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(escrowClient.getBalance(escrowAddress)).rejects.toThrow(
        ErrorEscrowAddressIsNotProvidedByFactory
      );
    });

    test('should successfully getBalance escrow', async () => {
      const escrowAddress = ethers.ZeroAddress;
      const amount = 100n;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.remainingFunds.mockRejectedValueOnce(
        new Error()
      );
      escrowClient.escrowContract.getBalance.mockReturnValue(amount);

      const balance = await escrowClient.getBalance(escrowAddress);

      expect(balance).toEqual(amount);
      expect(escrowClient.escrowContract.getBalance).toHaveBeenCalledWith();
    });

    test('should throw an error if the getBalance fails', async () => {
      const escrowAddress = ethers.ZeroAddress;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.remainingFunds.mockRejectedValueOnce(
        new Error()
      );
      escrowClient.escrowContract.getBalance.mockRejectedValueOnce(new Error());

      await expect(escrowClient.getBalance(escrowAddress)).rejects.toThrow();

      expect(escrowClient.escrowContract.getBalance).toHaveBeenCalledWith();
    });

    test('should successfully get balance of new escrow contracts', async () => {
      const escrowAddress = ethers.ZeroAddress;
      const amount = 100n;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.remainingFunds.mockResolvedValueOnce(amount);

      const balance = await escrowClient.getBalance(escrowAddress);

      expect(balance).toEqual(amount);
      expect(escrowClient.escrowContract.remainingFunds).toHaveBeenCalledWith();
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
      const escrowAddress = ethers.ZeroAddress;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(escrowClient.getManifestHash(escrowAddress)).rejects.toThrow(
        ErrorEscrowAddressIsNotProvidedByFactory
      );
    });

    test('should successfully getManifestHash', async () => {
      const escrowAddress = ethers.ZeroAddress;
      const hash = FAKE_HASH;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.manifestHash.mockReturnValue(hash);

      const manifestHash = await escrowClient.getManifestHash(escrowAddress);

      expect(manifestHash).toEqual(hash);
      expect(escrowClient.escrowContract.manifestHash).toHaveBeenCalledWith();
    });

    test('should throw an error if getManifestHash fails', async () => {
      const escrowAddress = ethers.ZeroAddress;

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
      const escrowAddress = ethers.ZeroAddress;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(escrowClient.getManifestUrl(escrowAddress)).rejects.toThrow(
        ErrorEscrowAddressIsNotProvidedByFactory
      );
    });

    test('should successfully getManifestUrl', async () => {
      const escrowAddress = ethers.ZeroAddress;
      const url = FAKE_URL;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.manifestUrl.mockReturnValue(url);

      const manifestUrl = await escrowClient.getManifestUrl(escrowAddress);

      expect(manifestUrl).toEqual(url);
      expect(escrowClient.escrowContract.manifestUrl).toHaveBeenCalledWith();
    });

    test('should throw an error if getManifestUrl fails', async () => {
      const escrowAddress = ethers.ZeroAddress;

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
      const escrowAddress = ethers.ZeroAddress;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(escrowClient.getResultsUrl(escrowAddress)).rejects.toThrow(
        ErrorEscrowAddressIsNotProvidedByFactory
      );
    });

    test('should successfully getResultsUrl', async () => {
      const escrowAddress = ethers.ZeroAddress;
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
      const escrowAddress = ethers.ZeroAddress;

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
      const escrowAddress = ethers.ZeroAddress;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(
        escrowClient.getIntermediateResultsUrl(escrowAddress)
      ).rejects.toThrow(ErrorEscrowAddressIsNotProvidedByFactory);
    });

    test('should successfully getIntermediateResultsUrl', async () => {
      const escrowAddress = ethers.ZeroAddress;
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
      const escrowAddress = ethers.ZeroAddress;

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
      const escrowAddress = ethers.ZeroAddress;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(escrowClient.getTokenAddress(escrowAddress)).rejects.toThrow(
        ErrorEscrowAddressIsNotProvidedByFactory
      );
    });

    test('should successfully getTokenAddress', async () => {
      const escrowAddress = ethers.ZeroAddress;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.token.mockReturnValue(ethers.ZeroAddress);

      const tokenAddress = await escrowClient.getTokenAddress(escrowAddress);

      expect(tokenAddress).toEqual(ethers.ZeroAddress);
      expect(escrowClient.escrowContract.token).toHaveBeenCalledWith();
    });

    test('should throw an error if getTokenAddress fails', async () => {
      const escrowAddress = ethers.ZeroAddress;

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
      const escrowAddress = ethers.ZeroAddress;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(escrowClient.getStatus(escrowAddress)).rejects.toThrow(
        ErrorEscrowAddressIsNotProvidedByFactory
      );
    });

    test('should successfully getStatus', async () => {
      const escrowAddress = ethers.ZeroAddress;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.status.mockReturnValue(EscrowStatus.Complete);

      const status = await escrowClient.getStatus(escrowAddress);

      expect(status).toEqual(EscrowStatus.Complete);
      expect(escrowClient.escrowContract.status).toHaveBeenCalledWith();
    });

    test('should throw an error if getStatus fails', async () => {
      const escrowAddress = ethers.ZeroAddress;

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
      const escrowAddress = ethers.ZeroAddress;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(
        escrowClient.getRecordingOracleAddress(escrowAddress)
      ).rejects.toThrow(ErrorEscrowAddressIsNotProvidedByFactory);
    });

    test('should successfully getRecordingOracleAddress', async () => {
      const escrowAddress = ethers.ZeroAddress;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.recordingOracle.mockReturnValue(
        ethers.ZeroAddress
      );

      const recordingOracleAddress =
        await escrowClient.getRecordingOracleAddress(escrowAddress);

      expect(recordingOracleAddress).toEqual(ethers.ZeroAddress);
      expect(
        escrowClient.escrowContract.recordingOracle
      ).toHaveBeenCalledWith();
    });

    test('should throw an error if getRecordingOracleAddress fails', async () => {
      const escrowAddress = ethers.ZeroAddress;

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
      const escrowAddress = ethers.ZeroAddress;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(
        escrowClient.getReputationOracleAddress(escrowAddress)
      ).rejects.toThrow(ErrorEscrowAddressIsNotProvidedByFactory);
    });

    test('should successfully getReputationOracleAddress', async () => {
      const escrowAddress = ethers.ZeroAddress;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.reputationOracle.mockReturnValue(
        ethers.ZeroAddress
      );

      const reputationOracleAddress =
        await escrowClient.getReputationOracleAddress(escrowAddress);

      expect(reputationOracleAddress).toEqual(ethers.ZeroAddress);
      expect(
        escrowClient.escrowContract.reputationOracle
      ).toHaveBeenCalledWith();
    });

    test('should throw an error if getReputationOracleAddress fails', async () => {
      const escrowAddress = ethers.ZeroAddress;

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
      const escrowAddress = ethers.ZeroAddress;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(
        escrowClient.getExchangeOracleAddress(escrowAddress)
      ).rejects.toThrow(ErrorEscrowAddressIsNotProvidedByFactory);
    });

    test('should successfully getExchangeOracleAddress', async () => {
      const escrowAddress = ethers.ZeroAddress;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.exchangeOracle.mockReturnValue(
        ethers.ZeroAddress
      );

      const exchangeOracleAddress =
        await escrowClient.getExchangeOracleAddress(escrowAddress);

      expect(exchangeOracleAddress).toEqual(ethers.ZeroAddress);
      expect(escrowClient.escrowContract.exchangeOracle).toHaveBeenCalledWith();
    });

    test('should throw an error if getExchangeOracleAddress fails', async () => {
      const escrowAddress = ethers.ZeroAddress;

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
      const escrowAddress = ethers.ZeroAddress;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(
        escrowClient.getJobLauncherAddress(escrowAddress)
      ).rejects.toThrow(ErrorEscrowAddressIsNotProvidedByFactory);
    });

    test('should successfully get the job launcher address', async () => {
      const escrowAddress = ethers.ZeroAddress;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.launcher.mockReturnValue(ethers.ZeroAddress);

      const jobLauncherAddress =
        await escrowClient.getJobLauncherAddress(escrowAddress);

      expect(jobLauncherAddress).toEqual(ethers.ZeroAddress);
      expect(escrowClient.escrowContract.launcher).toHaveBeenCalledWith();
    });

    test('should throw an error if getJobLauncherAddress fails', async () => {
      const escrowAddress = ethers.ZeroAddress;

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
      const escrowAddress = ethers.ZeroAddress;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(false);

      await expect(
        escrowClient.getFactoryAddress(escrowAddress)
      ).rejects.toThrow(ErrorEscrowAddressIsNotProvidedByFactory);
    });

    test('should successfully get the escrow factory address', async () => {
      const escrowAddress = ethers.ZeroAddress;

      escrowClient.escrowFactoryContract.hasEscrow.mockReturnValue(true);
      escrowClient.escrowContract.escrowFactory.mockReturnValue(
        ethers.ZeroAddress
      );

      const escrowFactoryAddress =
        await escrowClient.getFactoryAddress(escrowAddress);

      expect(escrowFactoryAddress).toEqual(ethers.ZeroAddress);
      expect(escrowClient.escrowContract.escrowFactory).toHaveBeenCalledWith();
    });

    test('should throw an error if getFactoryAddress fails', async () => {
      const escrowAddress = ethers.ZeroAddress;

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
    test('should throw an error if chainId is invalid', async () => {
      await expect(
        EscrowUtils.getEscrows({ networks: [123] } as any)
      ).rejects.toThrow(ErrorUnsupportedChainID);
    });
    test('should throw an error if launcher is an invalid address', async () => {
      const launcher = FAKE_ADDRESS;

      await expect(
        EscrowUtils.getEscrows({ chainId: ChainId.POLYGON_AMOY, launcher })
      ).rejects.toThrow(ErrorInvalidAddress);
    });

    test('should throw an error if recordingOracle is an invalid address', async () => {
      const recordingOracle = FAKE_ADDRESS;

      await expect(
        EscrowUtils.getEscrows({
          chainId: ChainId.POLYGON_AMOY,
          recordingOracle,
        })
      ).rejects.toThrow(ErrorInvalidAddress);
    });

    test('should throw an error if reputationOracle is an invalid address', async () => {
      const reputationOracle = FAKE_ADDRESS;

      await expect(
        EscrowUtils.getEscrows({
          chainId: ChainId.POLYGON_AMOY,
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
        chainId: ChainId.POLYGON_AMOY,
      };

      const result = await EscrowUtils.getEscrows(filter);
      expect(result).toEqual(escrows);
      expect(gqlFetchSpy).toHaveBeenCalledWith(
        'https://api.studio.thegraph.com/query/74256/amoy/version/latest',
        GET_ESCROWS_QUERY(filter),
        {
          chainId: ChainId.POLYGON_AMOY,
          first: 10,
          skip: 0,
          exchangeOracle: undefined,
          from: undefined,
          launcher: undefined,
          orderDirection: OrderDirection.DESC,
          recordingOracle: undefined,
          reputationOracle: undefined,
          status: undefined,
          to: undefined,
        }
      );
    });

    test('should successfully getEscrows for the filter with status array', async () => {
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
          status: 'Pending',
          token: '0x0',
          totalFundedAmount: '3',
        },
        {
          id: '2',
          address: '0x0',
          amountPaid: '3',
          balance: '0',
          count: '1',
          jobRequesterId: '1',
          factoryAddress: '0x0',
          launcher: '0x0',
          status: 'Complete',
          token: '0x0',
          totalFundedAmount: '3',
        },
      ];
      const gqlFetchSpy = vi
        .spyOn(gqlFetch, 'default')
        .mockResolvedValue({ escrows });

      const result = await EscrowUtils.getEscrows({
        chainId: ChainId.POLYGON_AMOY,
        status: [EscrowStatus.Pending, EscrowStatus.Complete],
      });

      expect(result).toEqual(escrows);
      expect(gqlFetchSpy).toHaveBeenCalled();
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
        chainId: ChainId.POLYGON_AMOY,
        launcher: ethers.ZeroAddress,
      });

      expect(result).toEqual(escrows);
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
        chainId: ChainId.POLYGON_AMOY,
        jobRequesterId: '1',
      });

      expect(result).toEqual(escrows);
      expect(gqlFetchSpy).toHaveBeenCalled();
    });

    test('should successfully getEscrows with pagination', async () => {
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
        chainId: ChainId.POLYGON_AMOY,
        first: 100,
        skip: 10,
      };

      const result = await EscrowUtils.getEscrows(filter);
      expect(result).toEqual(escrows);
      expect(gqlFetchSpy).toHaveBeenCalledWith(
        'https://api.studio.thegraph.com/query/74256/amoy/version/latest',
        GET_ESCROWS_QUERY(filter),
        {
          chainId: ChainId.POLYGON_AMOY,
          first: 100,
          skip: 10,
          exchangeOracle: undefined,
          from: undefined,
          launcher: undefined,
          orderDirection: OrderDirection.DESC,
          recordingOracle: undefined,
          reputationOracle: undefined,
          status: undefined,
          to: undefined,
        }
      );
    });

    test('should successfully getEscrows with pagination over limits', async () => {
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
        chainId: ChainId.POLYGON_AMOY,
        first: 20000,
        skip: 10,
      };

      const result = await EscrowUtils.getEscrows(filter);
      expect(result).toEqual(escrows);
      expect(gqlFetchSpy).toHaveBeenCalledWith(
        'https://api.studio.thegraph.com/query/74256/amoy/version/latest',
        GET_ESCROWS_QUERY(filter),
        {
          chainId: ChainId.POLYGON_AMOY,
          first: 1000,
          skip: 10,
          exchangeOracle: undefined,
          from: undefined,
          launcher: undefined,
          orderDirection: OrderDirection.DESC,
          recordingOracle: undefined,
          reputationOracle: undefined,
          status: undefined,
          to: undefined,
        }
      );
    });
  });

  describe('getEscrow', () => {
    test('should throw an error if chain id is an unsupported id', async () => {
      const chainId = -1;
      const escrowAddress = ethers.ZeroAddress;

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
        address: ethers.ZeroAddress,
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

      const result = await EscrowUtils.getEscrow(chainId, ethers.ZeroAddress);

      expect(result).toEqual(escrow);
      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[ChainId.LOCALHOST]?.subgraphUrl,
        GET_ESCROW_BY_ADDRESS_QUERY(),
        { escrowAddress: escrow.address }
      );
    });
  });

  describe('getStatusEvents', () => {
    afterEach(() => {
      vi.clearAllMocks();
    });

    test('should throw an error if chainId is invalid', async () => {
      await expect(EscrowUtils.getStatusEvents(123 as any)).rejects.toThrow(
        ErrorUnsupportedChainID
      );
    });

    test('should throw an error if launcher address is invalid', async () => {
      await expect(
        EscrowUtils.getStatusEvents({
          chainId: ChainId.POLYGON_AMOY,
          launcher: 'invalid_address',
        })
      ).rejects.toThrow(ErrorInvalidAddress);
    });

    test('should successfully getStatusEvents with default statuses', async () => {
      const pendingEvents = [
        {
          escrowAddress: '0x1',
          timestamp: '1234567890',
          status: 'Pending',
          chainId: ChainId.LOCALHOST,
        },
        {
          escrowAddress: '0x2',
          timestamp: '1234567891',
          status: 'Pending',
          chainId: ChainId.LOCALHOST,
        },
      ];

      const gqlFetchSpy = vi
        .spyOn(gqlFetch, 'default')
        .mockResolvedValueOnce({ escrowStatusEvents: pendingEvents });

      const result = await EscrowUtils.getStatusEvents({
        chainId: ChainId.LOCALHOST,
      });
      expect(result).toEqual(pendingEvents);
      expect(gqlFetchSpy).toHaveBeenCalled();
    });

    test('should successfully getStatusEvents with specified dates', async () => {
      const fromDate = new Date('2023-01-01');
      const toDate = new Date('2023-12-31');

      const pendingEvents = [
        {
          escrowAddress: '0x1',
          timestamp: '1234567890',
          status: 'Pending',
          chainId: ChainId.POLYGON_AMOY,
        },
        {
          escrowAddress: '0x2',
          timestamp: '1234567891',
          status: 'Pending',
          chainId: ChainId.POLYGON_AMOY,
        },
      ];

      const gqlFetchSpy = vi
        .spyOn(gqlFetch, 'default')
        .mockResolvedValueOnce({ escrowStatusEvents: pendingEvents });

      const result = await EscrowUtils.getStatusEvents({
        chainId: ChainId.POLYGON_AMOY,
        from: fromDate,
        to: toDate,
      });

      expect(result).toEqual(pendingEvents);
      expect(gqlFetchSpy).toHaveBeenCalled();
    });

    test('should successfully getStatusEvents with all parameters', async () => {
      const fromDate = new Date('2023-01-01');
      const toDate = new Date('2023-12-31');

      const partialEvents = [
        {
          escrowAddress: '0x1',
          timestamp: '1234567890',
          status: 'Partial',
          chainId: ChainId.POLYGON_AMOY,
        },
        {
          escrowAddress: '0x2',
          timestamp: '1234567891',
          status: 'Partial',
          chainId: ChainId.POLYGON_AMOY,
        },
      ];

      const gqlFetchSpy = vi
        .spyOn(gqlFetch, 'default')
        .mockResolvedValueOnce({ escrowStatusEvents: partialEvents });

      const result = await EscrowUtils.getStatusEvents({
        chainId: ChainId.POLYGON_AMOY,
        statuses: [EscrowStatus.Partial],
        from: fromDate,
        to: toDate,
      });

      expect(result).toEqual(partialEvents);
      expect(gqlFetchSpy).toHaveBeenCalled();
    });

    test('should successfully getStatusEvents with default statuses and specified dates', async () => {
      const fromDate = new Date('2023-01-01');
      const toDate = new Date('2023-12-31');

      const pendingEvents = [
        {
          escrowAddress: '0x1',
          timestamp: '1234567890',
          status: 'Pending',
          chainId: ChainId.POLYGON_AMOY,
        },
        {
          escrowAddress: '0x2',
          timestamp: '1234567891',
          status: 'Pending',
          chainId: ChainId.POLYGON_AMOY,
        },
      ];

      const gqlFetchSpy = vi
        .spyOn(gqlFetch, 'default')
        .mockResolvedValueOnce({ escrowStatusEvents: pendingEvents });

      const result = await EscrowUtils.getStatusEvents({
        chainId: ChainId.POLYGON_AMOY,
        from: fromDate,
        to: toDate,
      });

      expect(result).toEqual(pendingEvents);
      expect(gqlFetchSpy).toHaveBeenCalled();
    });
  });

  describe('getPayouts', () => {
    afterEach(() => {
      vi.clearAllMocks();
    });

    test('should throw an error if chainId is invalid', async () => {
      await expect(
        EscrowUtils.getPayouts({ chainId: 123 } as any)
      ).rejects.toThrow(ErrorUnsupportedChainID);
    });

    test('should throw an error if escrowAddress is an invalid address', async () => {
      const filter = {
        chainId: ChainId.POLYGON_AMOY,
        escrowAddress: 'invalid_address',
      };

      await expect(EscrowUtils.getPayouts(filter)).rejects.toThrow(
        ErrorInvalidAddress
      );
    });

    test('should throw an error if recipient is an invalid address', async () => {
      const filter = {
        chainId: ChainId.POLYGON_AMOY,
        recipient: 'invalid_address',
      };

      await expect(EscrowUtils.getPayouts(filter)).rejects.toThrow(
        ErrorInvalidAddress
      );
    });

    test('should successfully getPayouts', async () => {
      const payouts = [
        {
          id: '1',
          escrowAddress: '0x1234567890123456789012345678901234567890',
          recipient: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
          amount: '1000000000000000000',
          createdAt: '1672531200',
        },
        {
          id: '2',
          escrowAddress: '0x1234567890123456789012345678901234567890',
          recipient: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
          amount: '2000000000000000000',
          createdAt: '1672617600',
        },
      ];

      const gqlFetchSpy = vi
        .spyOn(gqlFetch, 'default')
        .mockResolvedValue({ payouts });

      const filter = {
        chainId: ChainId.POLYGON_AMOY,
      };

      const result = await EscrowUtils.getPayouts(filter);
      expect(result).toEqual(payouts);
      expect(gqlFetchSpy).toHaveBeenCalledWith(
        'https://api.studio.thegraph.com/query/74256/amoy/version/latest',
        GET_PAYOUTS_QUERY(filter),
        {
          escrowAddress: undefined,
          recipient: undefined,
          from: undefined,
          to: undefined,
          first: 10,
          skip: 0,
          orderDirection: OrderDirection.DESC,
        }
      );
    });

    test('should successfully getPayouts with filters', async () => {
      const payouts = [
        {
          id: '1',
          escrowAddress: '0x1234567890123456789012345678901234567890',
          recipient: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
          amount: '1000000000000000000',
          createdAt: '1672531200',
        },
      ];

      const gqlFetchSpy = vi
        .spyOn(gqlFetch, 'default')
        .mockResolvedValue({ payouts });

      const filter = {
        chainId: ChainId.POLYGON_AMOY,
        escrowAddress: ethers.ZeroAddress,
        recipient: ethers.ZeroAddress,
        from: new Date('2023-01-01'),
        to: new Date('2023-01-02'),
      };

      const result = await EscrowUtils.getPayouts(filter);
      expect(result).toEqual(payouts);
      expect(gqlFetchSpy).toHaveBeenCalledWith(
        'https://api.studio.thegraph.com/query/74256/amoy/version/latest',
        GET_PAYOUTS_QUERY(filter),
        {
          escrowAddress: filter.escrowAddress.toLowerCase(),
          recipient: filter.recipient.toLowerCase(),
          from: Math.floor(filter.from.getTime() / 1000),
          to: Math.floor(filter.to.getTime() / 1000),
          first: 10,
          skip: 0,
          orderDirection: OrderDirection.DESC,
        }
      );
    });

    test('should successfully getPayouts with pagination', async () => {
      const payouts = [
        {
          id: '1',
          escrowAddress: '0x1234567890123456789012345678901234567890',
          recipient: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
          amount: '1000000000000000000',
          createdAt: '1672531200',
        },
        {
          id: '2',
          escrowAddress: '0x1234567890123456789012345678901234567890',
          recipient: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
          amount: '2000000000000000000',
          createdAt: '1672617600',
        },
      ];

      const gqlFetchSpy = vi
        .spyOn(gqlFetch, 'default')
        .mockResolvedValue({ payouts });

      const filter = {
        chainId: ChainId.POLYGON_AMOY,
        first: 20,
        skip: 10,
      };

      const result = await EscrowUtils.getPayouts(filter);
      expect(result).toEqual(payouts);
      expect(gqlFetchSpy).toHaveBeenCalledWith(
        'https://api.studio.thegraph.com/query/74256/amoy/version/latest',
        GET_PAYOUTS_QUERY(filter),
        {
          escrowAddress: undefined,
          recipient: undefined,
          from: undefined,
          to: undefined,
          first: 20,
          skip: 10,
          orderDirection: OrderDirection.DESC,
        }
      );
    });

    test('should successfully getPayouts with pagination over limits', async () => {
      const payouts = [
        {
          id: '1',
          escrowAddress: '0x1234567890123456789012345678901234567890',
          recipient: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
          amount: '1000000000000000000',
          createdAt: '1672531200',
        },
        {
          id: '2',
          escrowAddress: '0x1234567890123456789012345678901234567890',
          recipient: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
          amount: '2000000000000000000',
          createdAt: '1672617600',
        },
      ];

      const gqlFetchSpy = vi
        .spyOn(gqlFetch, 'default')
        .mockResolvedValue({ payouts });

      const filter = {
        chainId: ChainId.POLYGON_AMOY,
        first: 20000,
        skip: 10,
      };

      const result = await EscrowUtils.getPayouts(filter);
      expect(result).toEqual(payouts);
      expect(gqlFetchSpy).toHaveBeenCalledWith(
        'https://api.studio.thegraph.com/query/74256/amoy/version/latest',
        GET_PAYOUTS_QUERY(filter),
        {
          escrowAddress: undefined,
          recipient: undefined,
          from: undefined,
          to: undefined,
          first: 1000,
          skip: 10,
          orderDirection: OrderDirection.DESC,
        }
      );
    });

    test('should return an empty array if no payouts are found', async () => {
      const gqlFetchSpy = vi
        .spyOn(gqlFetch, 'default')
        .mockResolvedValue({ payouts: [] });

      const filter = {
        chainId: ChainId.POLYGON_AMOY,
      };

      const result = await EscrowUtils.getPayouts(filter);
      expect(result).toEqual([]);
      expect(gqlFetchSpy).toHaveBeenCalled();
    });
  });
});
