import { MetaHumanGovernor__factory } from '@human-protocol/core/typechain-types';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { ethers } from 'ethers';
import { EnvironmentConfigService } from '../../common/config/environment-config.service';
import { ProposalState } from '../../common/enums/proposal';
import { ProposalResponse } from './model/governance.model';

const N_BLOCKS_LOOKBACK = 100000;

type Proposal = {
  proposalId: string;
  voteStart: number;
  voteEnd: number;
};

@Injectable()
export class GovernanceService {
  private readonly logger = new Logger(GovernanceService.name);

  constructor(
    private readonly configService: EnvironmentConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  public async getProposals(): Promise<ProposalResponse[]> {
    const provider = new ethers.JsonRpcProvider(
      this.configService.governanceRpcUrl,
    );
    const contract = MetaHumanGovernor__factory.connect(
      this.configService.governorAddress,
      provider,
    );

    const currentBlock = await provider.getBlockNumber();
    const lastScannedBlockKey = this.generateCacheKey('last-scanned-block');
    const proposalListKey = this.generateCacheKey('proposal', 'list');

    const cachedLastScannedBlock =
      (await this.cacheManager.get<number>(lastScannedBlockKey)) ?? 0;

    const fromBlockBase =
      cachedLastScannedBlock > 0
        ? cachedLastScannedBlock + 1
        : Math.max(0, currentBlock - N_BLOCKS_LOOKBACK);
    const fromBlock = Math.min(fromBlockBase, currentBlock);

    let proposalList: Proposal[] = [];
    try {
      proposalList = await this.getProposalCreatedEvents(contract, fromBlock);
    } catch (err) {
      this.logger.warn(
        `getProposalCreatedEvents failed, falling back to cached list: ${
          (err as Error)?.message || err
        }`,
      );
      proposalList =
        (await this.cacheManager.get<Proposal[]>(proposalListKey)) || [];
    }

    const proposals: ProposalResponse[] = [];
    const keptProposalList: typeof proposalList = [];

    for (const proposal of proposalList) {
      let state: ProposalState;
      try {
        state = Number(
          await contract.state(proposal.proposalId),
        ) as ProposalState;
      } catch (err) {
        this.logger.warn(
          `Failed to fetch state for proposal ${proposal.proposalId}: ${(err as Error)?.message || err}`,
        );
        continue;
      }

      if (state === ProposalState.PENDING) {
        keptProposalList.push(proposal);
        proposals.push({
          proposalId: proposal.proposalId,
          forVotes: 0,
          againstVotes: 0,
          abstainVotes: 0,
          voteStart: (proposal.voteStart ?? 0) * 1000,
          voteEnd: (proposal.voteEnd ?? 0) * 1000,
        });
        continue;
      }

      if (state !== ProposalState.ACTIVE) {
        continue;
      }

      keptProposalList.push(proposal);

      let againstBn: ethers.BigNumberish,
        forBn: ethers.BigNumberish,
        abstainBn: ethers.BigNumberish;
      try {
        const votes = (await contract.proposalVotes(proposal.proposalId)) as [
          ethers.BigNumberish,
          ethers.BigNumberish,
          ethers.BigNumberish,
        ];
        [againstBn, forBn, abstainBn] = votes;
      } catch (err) {
        this.logger.warn(
          `Failed to fetch votes for proposal ${proposal.proposalId}: ${(err as Error)?.message || err}`,
        );
        continue;
      }

      proposals.push({
        proposalId: proposal.proposalId,
        forVotes: Number(ethers.formatEther(forBn)),
        againstVotes: Number(ethers.formatEther(againstBn)),
        abstainVotes: Number(ethers.formatEther(abstainBn)),
        voteStart: (proposal.voteStart ?? 0) * 1000,
        voteEnd: (proposal.voteEnd ?? 0) * 1000,
      });
    }

    await this.cacheManager.set(proposalListKey, keptProposalList, 0);

    return proposals;
  }

  private generateCacheKey(...parts: (string | number)[]): string {
    return ['governance', this.configService.governorAddress, ...parts]
      .map(String)
      .join(':');
  }

  private async getProposalCreatedEvents(
    contract: ReturnType<typeof MetaHumanGovernor__factory.connect>,
    fromBlock: number,
  ): Promise<Proposal[]> {
    const proposalListKey = this.generateCacheKey('proposal', 'list');
    const lastScannedBlockKey = this.generateCacheKey('last-scanned-block');

    const filter = contract.filters.ProposalCreated();
    const logs = await contract.queryFilter(filter, fromBlock, 'latest');

    const cachedList: Proposal[] =
      (await this.cacheManager.get<Proposal[]>(proposalListKey)) || [];
    const nextList: Proposal[] = [...cachedList];

    for (const log of logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        const proposalId = (
          parsed?.args.proposalId as ethers.BigNumberish
        ).toString();

        const proposal: Proposal = {
          proposalId,
          voteStart: Number(parsed?.args?.voteStart),
          voteEnd: Number(parsed?.args?.voteEnd),
        };
        nextList.push(proposal);
      } catch (err) {
        this.logger.warn(
          `Failed to parse/cache ProposalCreated log: ${(err as Error)?.message || err}`,
        );
      }
    }

    await this.cacheManager.set(proposalListKey, nextList, 0);

    const lastScannedBlock = logs.length
      ? Number(logs[logs.length - 1].blockNumber)
      : fromBlock;
    await this.cacheManager.set(lastScannedBlockKey, lastScannedBlock, 0);

    return nextList;
  }
}
