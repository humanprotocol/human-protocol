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

    const fromBlock =
      cachedLastScannedBlock > 0
        ? cachedLastScannedBlock + 1
        : Math.max(0, currentBlock - N_BLOCKS_LOOKBACK);

    let proposalList: Proposal[] = [];
    try {
      const newProposals = await this.getProposalCreatedEvents(
        contract,
        fromBlock,
        currentBlock,
      );

      const cachedList =
        (await this.cacheManager.get<Proposal[]>(proposalListKey)) || [];

      proposalList = _.uniqBy([...cachedList, ...newProposals], 'proposalId');
    } catch (err) {
      this.logger.warn(
        'getProposalCreatedEvents failed, falling back to cached list',
        {
          error: err,
        },
      );
      proposalList =
        (await this.cacheManager.get<Proposal[]>(proposalListKey)) || [];
    }

    const proposals: ProposalResponse[] = [];
    const keptProposalList: typeof proposalList = [];

    for (const proposal of proposalList) {
      const voteStartMs = (proposal.voteStart ?? 0) * 1000;
      const voteEndMs = (proposal.voteEnd ?? 0) * 1000;

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

      keptProposalList.push(proposal);

      let forVotes = 0;
      let againstVotes = 0;
      let abstainVotes = 0;
      if (state === ProposalState.ACTIVE) {
        try {
          const votes = (await contract.proposalVotes(proposal.proposalId)) as [
            ethers.BigNumberish,
            ethers.BigNumberish,
            ethers.BigNumberish,
          ];
          const [againstBn, forBn, abstainBn] = votes;
          forVotes = Number(ethers.formatEther(forBn));
          againstVotes = Number(ethers.formatEther(againstBn));
          abstainVotes = Number(ethers.formatEther(abstainBn));
        } catch (err) {
          this.logger.warn('Failed to fetch votes for proposal', {
            error: err,
            proposalId: proposal.proposalId,
          });
          continue;
        }
      }

      proposals.push({
        proposalId: proposal.proposalId,
        forVotes,
        againstVotes,
        abstainVotes,
        voteStart: voteStartMs,
        voteEnd: voteEndMs,
      });
    }

    await this.cacheManager.set(proposalListKey, keptProposalList);
    await this.cacheManager.set(lastScannedBlockKey, currentBlock);

    return proposals;
  }

  private async getProposalCreatedEvents(
    contract: ReturnType<typeof MetaHumanGovernor__factory.connect>,
    fromBlock: number,
    toBlock: number,
  ): Promise<Proposal[]> {
    const filter = contract.filters.ProposalCreated();
    const logs = await contract.queryFilter(filter, fromBlock, toBlock);

    const proposals: Proposal[] = [];
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
