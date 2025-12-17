jest.mock('@human-protocol/sdk');

import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { StakingClient } from '@human-protocol/sdk';
import { Test, TestingModule } from '@nestjs/testing';
import { ethers } from 'ethers';

import { SupportedExchange } from '@/common/constants';
import { StakingConfigService, Web3ConfigService } from '@/config';
import { type ExchangeClient } from '@/modules/exchange';
import { ExchangeClientFactory } from '@/modules/exchange/exchange-client.factory';
import {
  ExchangeApiKeyNotFoundError,
  ExchangeApiKeysService,
} from '@/modules/exchange-api-keys';
import { UserEntity, UserNotFoundError, UserRepository } from '@/modules/user';
import { WalletWithProvider, Web3Service } from '@/modules/web3';
import { mockWeb3ConfigService } from '@/modules/web3/fixtures';

import { StakingService } from './staking.service';

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
const mockedStakingClient = jest.mocked(StakingClient);

describe('StakingService', () => {
  let stakingService: StakingService;

  beforeAll(async () => {
    mockExchangeClientFactory.create.mockResolvedValue(mockExchangeClient);
    mockExchangeClient.getAccountBalance.mockReset();
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

  afterAll(() => {
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
    let spyOnGetExchangeStakedBalance: jest.SpyInstance;
    let spyOnGetOnChainStakedBalance: jest.SpyInstance;

    beforeAll(() => {
      spyOnGetExchangeStakedBalance = jest
        .spyOn(stakingService, 'getExchangeStakedBalance')
        .mockImplementation();
      spyOnGetOnChainStakedBalance = jest
        .spyOn(stakingService, 'getOnChainStakedBalance')
        .mockImplementation();
    });

    afterAll(() => {
      spyOnGetExchangeStakedBalance.mockRestore();
      spyOnGetOnChainStakedBalance.mockRestore();
    });

    it('throws when user is not found', async () => {
      mockUserRepository.findOneById.mockResolvedValueOnce(null);

      await expect(
        stakingService.getStakeSummary(user.id),
      ).rejects.toBeInstanceOf(UserNotFoundError);
    });

    it('returns aggregated exchange and on-chain stakes', async () => {
      mockUserRepository.findOneById.mockResolvedValueOnce(user as UserEntity);
      spyOnGetExchangeStakedBalance.mockResolvedValueOnce(exchangeStake);
      spyOnGetOnChainStakedBalance.mockResolvedValueOnce(onChainStake);

      const result = await stakingService.getStakeSummary(user.id);

      expect(spyOnGetExchangeStakedBalance).toHaveBeenCalledWith(user.id);
      expect(spyOnGetOnChainStakedBalance).toHaveBeenCalledWith(
        user.evmAddress,
      );
      expect(result).toEqual({
        exchangeStake: exchangeStake.toString(),
        onChainStake: onChainStake.toString(),
        minThreshold: mockStakingConfigService.minThreshold.toString(),
      });
    });

    it('skips on-chain lookup when user has no address', async () => {
      mockUserRepository.findOneById.mockResolvedValueOnce({
        ...user,
        evmAddress: null,
      } as UserEntity);
      spyOnGetExchangeStakedBalance.mockResolvedValueOnce(exchangeStake);

      const result = await stakingService.getStakeSummary(user.id);

      expect(spyOnGetOnChainStakedBalance).not.toHaveBeenCalled();
      expect(result).toEqual({
        exchangeStake: exchangeStake.toString(),
        onChainStake: '0',
        minThreshold: mockStakingConfigService.minThreshold.toString(),
      });
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

      const getStakerInfoMock = jest
        .fn()
        .mockResolvedValue({ stakedAmount, lockedAmount });
      mockedStakingClient.build.mockResolvedValueOnce({
        getStakerInfo: getStakerInfoMock,
      } as unknown as StakingClient);

      const result = await stakingService.getOnChainStakedBalance(address);

      expect(mockedStakingClient.build).toHaveBeenCalledWith(mockProvider);
      expect(getStakerInfoMock).toHaveBeenCalledWith(address);
      expect(result).toBe(
        Number(ethers.formatEther(stakedAmount + lockedAmount)),
      );
    });
  });
});
