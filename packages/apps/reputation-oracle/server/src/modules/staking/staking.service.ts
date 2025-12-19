import { StakingClient } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';

import { SupportedExchange } from '@/common/constants';
import { StakingConfigService, Web3ConfigService } from '@/config';
import logger from '@/logger';
import { ExchangeClientFactory } from '@/modules/exchange/exchange-client.factory';
import { ExchangeApiKeysService } from '@/modules/exchange-api-keys';
import { UserNotFoundError, UserRepository } from '@/modules/user';
import { Web3Service } from '@/modules/web3';
import { formatStake } from '@/utils/stake';

import { StakeSummaryData } from './types';

@Injectable()
export class StakingService {
  private readonly logger = logger.child({
    context: StakingService.name,
  });

  constructor(
    private readonly exchangeApiKeysService: ExchangeApiKeysService,
    private readonly exchangeClientFactory: ExchangeClientFactory,
    private readonly userRepository: UserRepository,
    private readonly web3Service: Web3Service,
    private readonly stakingConfigService: StakingConfigService,
    private readonly web3ConfigService: Web3ConfigService,
  ) {}

  async getExchangeStakedBalance(userId: number): Promise<number> {
    const apiKeys = await this.exchangeApiKeysService.retrieve(userId);
    if (!apiKeys) {
      return 0;
    }

    const client = await this.exchangeClientFactory.create(
      apiKeys.exchangeName as SupportedExchange,
      {
        apiKey: apiKeys.apiKey,
        secretKey: apiKeys.secretKey,
      },
      { timeoutMs: this.stakingConfigService.timeoutMs },
    );

    return client.getAccountBalance(this.stakingConfigService.asset);
  }

  async getOnChainStakedBalance(address: string): Promise<number> {
    const chainId = this.web3ConfigService.reputationNetworkChainId;
    const provider = this.web3Service.getSigner(chainId).provider;

    const stakingClient = await StakingClient.build(provider);
    const stakerInfo = await stakingClient.getStakerInfo(address);

    const total =
      (stakerInfo.stakedAmount ?? 0n) + (stakerInfo.lockedAmount ?? 0n);
    return Number(ethers.formatEther(total));
  }

  async getStakeSummary(userId: number): Promise<StakeSummaryData> {
    const user = await this.userRepository.findOneById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    const summary: StakeSummaryData = {
      exchangeStake: '0',
      onChainStake: '0',
      minThreshold: this.stakingConfigService.minThreshold.toString(),
      eligibilityEnabled: this.stakingConfigService.eligibilityEnabled,
    };

    try {
      summary.exchangeStake = formatStake(
        await this.getExchangeStakedBalance(userId),
      );
    } catch (error) {
      summary.exchangeError = error.message
        ? error.message
        : 'Unable to fetch exchange stake';
      this.logger.warn('Failed to retrieve exchange stake', {
        userId,
        error,
      });
    }

    if (user.evmAddress) {
      try {
        summary.onChainStake = formatStake(
          await this.getOnChainStakedBalance(user.evmAddress),
        );
      } catch (error) {
        summary.onChainError = error.message
          ? error.message
          : 'Unable to fetch on-chain stake';
        this.logger.warn('Failed to retrieve on-chain stake', {
          userId,
          evmAddress: user.evmAddress,
          error,
        });
      }
    }

    return summary;
  }
}
