import MetaHumanGovernorABI from '@human-protocol/core/abis/governance/MetaHumanGovernor.json';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { ethers } from 'ethers';
import { EnvironmentConfigService } from '../../common/config/environment-config.service';
import {
  GOVERNANCE_LAST_SCANNED_BLOCK,
  GOVERNANCE_PROPOSAL_IDS,
  GOVERNANCE_PROPOSAL_SNAPSHOT,
  GOVERNANCE_PROPOSAL_DEADLINE,
} from '../../common/constants/cache';
import { ProposalState } from '../../common/enums/proposal';
import { ActiveProposalResponse } from './model/governance.model';

@Injectable()
export class GovernanceService {
  constructor(
    private readonly configService: EnvironmentConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  public async getActiveProposals(): Promise<ActiveProposalResponse[]> {
    const provider = new ethers.JsonRpcProvider(
      this.configService.governanceRpcUrl,
    );
    const contract = new ethers.Contract(
      this.configService.governorAddress,
      MetaHumanGovernorABI,
      provider,
    );

    const currentBlock = await provider.getBlockNumber();
    const lastBlockKey = `${GOVERNANCE_LAST_SCANNED_BLOCK}:${this.configService.governorAddress}`;
    const idsKey = `${GOVERNANCE_PROPOSAL_IDS}:${this.configService.governorAddress}`;

    const defaultLookback = 100000;
    const cachedLastBlock =
      (await this.cacheManager.get<number>(lastBlockKey)) ?? 0;
    const fromBlock =
      cachedLastBlock > 0 ? cachedLastBlock : currentBlock - defaultLookback;
    const filter = contract.filters.ProposalCreated();
    const logs = await contract.queryFilter(filter, fromBlock, 'latest');

    let cachedIds =
      (await this.cacheManager.get<string[] | undefined>(idsKey)) || [];
    const idSet = new Set<string>(cachedIds);
    for (const log of logs) {
      const parsed = contract.interface.parseLog(log);
      const proposalId = (
        parsed?.args.proposalId as ethers.BigNumberish
      ).toString();
      idSet.add(proposalId);
    }
    cachedIds = Array.from(idSet);
    await this.cacheManager.set(idsKey, cachedIds, 0);
    await this.cacheManager.set(lastBlockKey, currentBlock, 0);

    const active: ActiveProposalResponse[] = [];
    for (const proposalId of cachedIds) {
      const state = Number(await contract.state(proposalId)) as ProposalState;
      if (state !== ProposalState.ACTIVE) continue;

      const snapshotKey = `${GOVERNANCE_PROPOSAL_SNAPSHOT}:${this.configService.governorAddress}:${proposalId}`;
      const cachedSnapshot =
        await this.cacheManager.get<ActiveProposalResponse>(snapshotKey);
      if (cachedSnapshot) {
        active.push(cachedSnapshot);
        continue;
      }

      const deadlineKey = `${GOVERNANCE_PROPOSAL_DEADLINE}:${this.configService.governorAddress}:${proposalId}`;
      let deadline = await this.cacheManager.get<number>(deadlineKey);
      if (!deadline) {
        deadline = Number(await contract.proposalDeadline(proposalId));
        await this.cacheManager.set(deadlineKey, deadline, 0);
      }

      const votes = (await contract.proposalVotes(proposalId)) as [
        ethers.BigNumberish,
        ethers.BigNumberish,
        ethers.BigNumberish,
      ];
      const [againstBn, forBn, abstainBn] = votes;

      const snapshot: ActiveProposalResponse = {
        proposalId: proposalId.toString(),
        forVotes: Number(ethers.formatEther(forBn)),
        againstVotes: Number(ethers.formatEther(againstBn)),
        abstainVotes: Number(ethers.formatEther(abstainBn)),
        deadline,
      };
      active.push(snapshot);
      await this.cacheManager.set(
        snapshotKey,
        snapshot,
        this.configService.cacheTtlGovernanceSnapshot,
      );
    }

    return active;
  }
}
