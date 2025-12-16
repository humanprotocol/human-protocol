import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ethers } from 'ethers';

import { SupportedExchange } from '@/common/constants';
import { StakingConfigService, Web3ConfigService } from '@/config';
import { ExchangeClientFactory } from '@/modules/exchange/exchange-client.factory';
import {
  ExchangeApiKeyNotFoundError,
  ExchangeApiKeysService,
} from '@/modules/exchange-api-keys';
import { UserEntity, UserNotFoundError, UserRepository } from '@/modules/user';
import { WalletWithProvider, Web3Service } from '@/modules/web3';
import { mockWeb3ConfigService } from '@/modules/web3/fixtures';

import { StakingService } from './staking.service';
import { ExchangeClient } from '../exchange/types';

jest.mock('@human-protocol/sdk', () => {
  const actual = jest.requireActual('@human-protocol/sdk');
  return {
    ...actual,
    StakingClient: {
      build: jest.fn(),
    },
  };
});

const { StakingClient } = jest.requireMock('@human-protocol/sdk');
const mockExchangeApiKeysService = createMock<ExchangeApiKeysService>();
const mockExchangeClientFactory = {
  create: jest.fn(),
};
const mockExchangeClient = createMock<ExchangeClient>();
const mockUserRepository = createMock<UserRepository>();
const mockWeb3Service = createMock<Web3Service>();
const mockStakingConfigService: Omit<StakingConfigService, 'configService'> = {
  eligibilityEnabled: true,
  minThreshold: faker.number.int({ min: 1, max: 1000 }),
  asset: 'HMT',
  timeoutMs: faker.number.int({ min: 1000, max: 10000 }),
};

describe('StakingService', () => {
  let stakingService: StakingService;

  beforeEach(async () => {
    mockExchangeClientFactory.create.mockResolvedValue(mockExchangeClient);
    mockExchangeClient.getAccountBalance.mockReset();
    (StakingClient.build as jest.Mock).mockReset();
    mockWeb3Service.getSigner.mockReturnValue({
      provider: {},
    } as never);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StakingService,
        {
          provide: ExchangeApiKeysService,
          useValue: mockExchangeApiKeysService,
        },
        {
          provide: ExchangeClientFactory,
          useValue: mockExchangeClientFactory,
        },
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: Web3Service, useValue: mockWeb3Service },
        { provide: StakingConfigService, useValue: mockStakingConfigService },
        { provide: Web3ConfigService, useValue: mockWeb3ConfigService },
      ],
    }).compile();

    stakingService = module.get(StakingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getExchangeStakedBalance', () => {
    const userId = faker.number.int();
    it('throws ExchangeApiKeyNotFoundError when user has no exchange keys', async () => {
      mockExchangeApiKeysService.retrieve.mockResolvedValueOnce(null);

      await expect(
        stakingService.getExchangeStakedBalance(userId),
      ).rejects.toBeInstanceOf(ExchangeApiKeyNotFoundError);
    });

    it('returns balance fetched from exchange client', async () => {
      const keys = {
        exchangeName: SupportedExchange.GATE,
        apiKey: faker.string.sample(),
        secretKey: faker.string.sample(),
      };
      const balance = faker.number.int();
      mockExchangeApiKeysService.retrieve.mockResolvedValueOnce(keys);
      mockExchangeClient.getAccountBalance.mockResolvedValueOnce(balance);

      const result = await stakingService.getExchangeStakedBalance(userId);
      expect(mockExchangeClientFactory.create).toHaveBeenCalledWith(
        keys.exchangeName,
        {
          apiKey: keys.apiKey,
          secretKey: keys.secretKey,
        },
        { timeoutMs: mockStakingConfigService.timeoutMs },
      );
      expect(mockExchangeClient.getAccountBalance).toHaveBeenCalledWith(
        mockStakingConfigService.asset,
      );
      expect(result).toBe(balance);
    });
  });

  describe('getStakeSummary', () => {
    const user = {
      id: faker.number.int(),
      evmAddress: faker.finance.ethereumAddress(),
    };
    const onChainStake = faker.number.int();
    const exchangeStake = faker.number.int();

    it('throws when user is not found', async () => {
      mockUserRepository.findOneById.mockResolvedValueOnce(null);

      await expect(
        stakingService.getStakeSummary(user.id),
      ).rejects.toBeInstanceOf(UserNotFoundError);
    });

    it('returns aggregated exchange and on-chain stakes', async () => {
      mockUserRepository.findOneById.mockResolvedValueOnce(user as UserEntity);
      const exchangeStakeSpy = jest
        .spyOn(stakingService, 'getExchangeStakedBalance')
        .mockResolvedValueOnce(exchangeStake);
      jest
        .spyOn(stakingService, 'getOnChainStakedBalance')
        .mockResolvedValueOnce(onChainStake);

      const result = await stakingService.getStakeSummary(user.id);

      expect(exchangeStakeSpy).toHaveBeenCalledWith(user.id);
      expect(stakingService.getOnChainStakedBalance).toHaveBeenCalledWith(
        user.evmAddress,
      );
      expect(result).toEqual({
        exchangeStake: exchangeStake.toLocaleString(undefined, {
          maximumFractionDigits: 18,
        }),
        onChainStake: onChainStake.toLocaleString(undefined, {
          maximumFractionDigits: 18,
        }),
        minThreshold: mockStakingConfigService.minThreshold.toLocaleString(
          undefined,
          {
            maximumFractionDigits: 18,
          },
        ),
      });
    });

    it('skips on-chain lookup when user has no address', async () => {
      mockUserRepository.findOneById.mockResolvedValueOnce({
        ...user,
        evmAddress: null,
      } as UserEntity);
      const exchangeStakeSpy = jest
        .spyOn(stakingService, 'getExchangeStakedBalance')
        .mockResolvedValueOnce(exchangeStake);
      jest.spyOn(stakingService, 'getOnChainStakedBalance');

      const result = await stakingService.getStakeSummary(user.id);

      expect(stakingService.getOnChainStakedBalance).not.toHaveBeenCalled();
      expect(result).toEqual({
        exchangeStake: exchangeStake.toLocaleString(undefined, {
          maximumFractionDigits: 18,
        }),
        onChainStake: '0',
        minThreshold: mockStakingConfigService.minThreshold.toLocaleString(
          undefined,
          {
            maximumFractionDigits: 18,
          },
        ),
      });

      exchangeStakeSpy.mockRestore();
    });
  });

  describe('getOnChainStakedBalance', () => {
    it('returns total staked and locked balance', async () => {
      const address = faker.finance.ethereumAddress();
      const stakedAmount = ethers.toBigInt(
        faker.number.int({ min: 500, max: 1000000 }),
      );
      const lockedAmount = ethers.toBigInt(
        faker.number.int({ min: 500, max: 999999 }),
      );
      const mockProvider = {};
      mockWeb3Service.getSigner.mockReturnValueOnce({
        provider: mockProvider,
      } as WalletWithProvider);
      const mockStakingClient = {
        getStakerInfo: jest.fn().mockResolvedValue({
          stakedAmount,
          lockedAmount,
        }),
      };
      (StakingClient.build as jest.Mock).mockResolvedValueOnce(
        mockStakingClient,
      );

      const result = await stakingService.getOnChainStakedBalance(address);

      expect(StakingClient.build).toHaveBeenCalledWith(mockProvider);
      expect(mockStakingClient.getStakerInfo).toHaveBeenCalledWith(address);
      expect(result).toBe(
        Number(ethers.formatEther(stakedAmount + lockedAmount)),
      );
    });
  });
});
