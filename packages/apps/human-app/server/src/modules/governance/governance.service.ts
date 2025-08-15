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
  GOVERNANCE_PROPOSAL_META,
} from '../../common/constants/cache';
import { ProposalState } from '../../common/enums/proposal';
import { ProposalResponse } from './model/governance.model';

@Injectable()
export class GovernanceService {
  constructor(
    private readonly configService: EnvironmentConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  public async getProposals(): Promise<ProposalResponse[]> {
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
    const fromBlockBase =
      cachedLastBlock > 0
        ? cachedLastBlock + 1
        : Math.max(0, currentBlock - defaultLookback);
    const fromBlock = Math.min(fromBlockBase, currentBlock);
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

      try {
        const voteStartBn = parsed?.args?.voteStart as
          | ethers.BigNumberish
          | undefined;
        const voteEndBn = parsed?.args?.voteEnd as
          | ethers.BigNumberish
          | undefined;

        if (voteStartBn !== undefined || voteEndBn !== undefined) {
          const metaKey = `${GOVERNANCE_PROPOSAL_META}:${this.configService.governorAddress}:${proposalId}`;
          const meta = (await this.cacheManager.get<{
            proposalId: string;
            voteStart?: number;
            voteEnd?: number;
          }>(metaKey)) || { proposalId };

          if (voteStartBn !== undefined) {
            meta.voteStart = Number(
              ethers.toNumber?.(voteStartBn as any) ?? voteStartBn.toString(),
            );
          }
          if (voteEndBn !== undefined) {
            meta.voteEnd = Number(
              ethers.toNumber?.(voteEndBn as any) ?? voteEndBn.toString(),
            );
          }

          await this.cacheManager.set(metaKey, meta, 0);
        }
      } catch {}
    }
    cachedIds = Array.from(idSet);
    await this.cacheManager.set(idsKey, cachedIds, 0);
    const lastScannedBlock = logs.length
      ? Number(logs[logs.length - 1].blockNumber)
      : currentBlock;
    await this.cacheManager.set(lastBlockKey, lastScannedBlock, 0);

    const active: ProposalResponse[] = [];
    const keptIds: string[] = [];
    for (const proposalId of cachedIds) {
      const state = Number(await contract.state(proposalId)) as ProposalState;

      const metaKey = `${GOVERNANCE_PROPOSAL_META}:${this.configService.governorAddress}:${proposalId}`;
      const meta = (await this.cacheManager.get<{
        proposalId: string;
        voteStart?: number;
        voteEnd?: number;
      }>(metaKey)) || { proposalId };

      if (meta.voteEnd === undefined) {
        meta.voteEnd = Number(await contract.proposalDeadline(proposalId));
      }
      if (meta.voteStart === undefined) {
        const snapshotBlock = Number(
          await contract.proposalSnapshot(proposalId),
        );
        const block = await provider.getBlock(snapshotBlock);
        meta.voteStart = block?.timestamp ?? 0;
      }
      await this.cacheManager.set(metaKey, meta, 0);

      if (state === ProposalState.PENDING) {
        keptIds.push(proposalId);

        active.push({
          proposalId: proposalId.toString(),
          forVotes: 0,
          againstVotes: 0,
          abstainVotes: 0,
          voteStart: meta.voteStart ?? 0,
          voteEnd: meta.voteEnd ?? 0,
        });
        continue;
      }

      if (state !== ProposalState.ACTIVE) {
        continue;
      }

      keptIds.push(proposalId);

      const snapshotKey = `${GOVERNANCE_PROPOSAL_SNAPSHOT}:${this.configService.governorAddress}:${proposalId}`;
      const cachedSnapshot =
        await this.cacheManager.get<ProposalResponse>(snapshotKey);
      if (cachedSnapshot) {
        active.push(cachedSnapshot);
        continue;
      }

      const votes = (await contract.proposalVotes(proposalId)) as [
        ethers.BigNumberish,
        ethers.BigNumberish,
        ethers.BigNumberish,
      ];
      const [againstBn, forBn, abstainBn] = votes;

      const snapshot: ProposalResponse = {
        proposalId: proposalId.toString(),
        forVotes: Number(ethers.formatEther(forBn)),
        againstVotes: Number(ethers.formatEther(againstBn)),
        abstainVotes: Number(ethers.formatEther(abstainBn)),
        voteStart: meta.voteStart ?? 0,
        voteEnd: meta.voteEnd ?? 0,
      };
      active.push(snapshot);
      await this.cacheManager.set(
        snapshotKey,
        snapshot,
        this.configService.cacheTtlGovernanceSnapshot,
      );
    }

    await this.cacheManager.set(idsKey, keptIds, 0);

    return active;
  }
}
