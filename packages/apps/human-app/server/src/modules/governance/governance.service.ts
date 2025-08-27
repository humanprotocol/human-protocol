import { MetaHumanGovernor__factory } from '@human-protocol/core/typechain-types';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { ethers } from 'ethers';
import _ from 'lodash';
import { EnvironmentConfigService } from '../../common/config/environment-config.service';
import { ProposalState } from '../../common/enums/proposal';
import { ProposalResponse } from './model/governance.model';

const N_BLOCKS_LOOKBACK = 100000;

type Block = {
  timestamp: number;
  number: number;
};
@Injectable()
export class GovernanceService {
  private readonly logger = new Logger(GovernanceService.name);

  constructor(
    private readonly configService: EnvironmentConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  public async getProposals(): Promise<ProposalResponse[]> {
    const lastScannedBlockKey = this.generateCacheKey('last-scanned-block');
    const proposalListKey = this.generateCacheKey('proposal', 'list');
    const cachedLastScannedBlock =
      await this.cacheManager.get<Block>(lastScannedBlockKey);
    const cachedProposals =
      (await this.cacheManager.get<ProposalResponse[]>(proposalListKey)) ?? [];

    if (
      cachedLastScannedBlock &&
      Date.now() - cachedLastScannedBlock.timestamp * 1000 <
        this.configService.cacheTtlProposals
    ) {
      return cachedProposals;
    }

    const provider = new ethers.JsonRpcProvider(
      this.configService.governanceRpcUrl,
    );
    const contract = MetaHumanGovernor__factory.connect(
      this.configService.governorAddress,
      provider,
    );

    const currentBlock = await provider.getBlock('latest');
    if (!currentBlock) {
      this.logger.error('No latest block from RPC');
      throw new Error('Blockchain node unavailable');
    }

    const fromBlock =
      (cachedLastScannedBlock?.number ?? 0) > 0
        ? (cachedLastScannedBlock?.number ?? 0) + 1
        : currentBlock.number - N_BLOCKS_LOOKBACK;

    let allProposals: ProposalResponse[] = [];
    try {
      const newProposals = await this.getProposalCreatedEvents(
        contract,
        fromBlock,
        currentBlock.number ?? 0,
      );

      allProposals = _.uniqBy(
        [...cachedProposals, ...newProposals],
        'proposalId',
      );
    } catch (err) {
      this.logger.warn('getProposalCreatedEvents failed; using previous kept', {
        error: err,
      });
    }

    const finalProposals: ProposalResponse[] = [];
    for (const proposal of allProposals) {
      let state: ProposalState;
      try {
        state = Number(
          await contract.state(proposal.proposalId),
        ) as ProposalState;
      } catch (err) {
        this.logger.warn('Failed to fetch state for proposal', {
          error: err,
          proposalId: proposal.proposalId,
        });
        continue;
      }

      if (state !== ProposalState.PENDING && state !== ProposalState.ACTIVE) {
        continue;
      }

      if (state === ProposalState.ACTIVE) {
        try {
          const votes = (await contract.proposalVotes(proposal.proposalId)) as [
            ethers.BigNumberish,
            ethers.BigNumberish,
            ethers.BigNumberish,
          ];
          const [againstBn, forBn, abstainBn] = votes;
          proposal.forVotes = Number(ethers.formatEther(forBn));
          proposal.againstVotes = Number(ethers.formatEther(againstBn));
          proposal.abstainVotes = Number(ethers.formatEther(abstainBn));
        } catch (err) {
          this.logger.warn('Failed to fetch votes for proposal', {
            error: err,
            proposalId: proposal.proposalId,
          });
          continue;
        }
      }

      finalProposals.push(proposal);
    }

    await this.cacheManager.set(proposalListKey, finalProposals);
    await this.cacheManager.set(lastScannedBlockKey, {
      number: currentBlock.number,
      timestamp: currentBlock.timestamp,
    });

    return finalProposals;
  }

  private async getProposalCreatedEvents(
    contract: ReturnType<typeof MetaHumanGovernor__factory.connect>,
    fromBlock: number,
    toBlock: number,
  ): Promise<ProposalResponse[]> {
    const filter = contract.filters.ProposalCreated();
    const logs = await contract.queryFilter(filter, fromBlock, toBlock);

    const proposals: ProposalResponse[] = [];
    for (const log of logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        const proposalId = (
          parsed?.args.proposalId as ethers.BigNumberish
        ).toString();

        const proposal: ProposalResponse = {
          proposalId,
          voteStart: Number(parsed?.args?.voteStart) * 1000,
          voteEnd: Number(parsed?.args?.voteEnd) * 1000,
          forVotes: 0,
          againstVotes: 0,
          abstainVotes: 0,
        };
        proposals.push(proposal);
      } catch (err) {
        this.logger.warn('Failed to parse ProposalCreated log', {
          error: err,
          log,
        });
      }
    }

    return proposals;
  }

  private generateCacheKey(...parts: (string | number)[]): string {
    return ['governance', this.configService.governorAddress, ...parts]
      .map(String)
      .join(':');
  }
}
