#!/usr/bin/env ts-node
/* eslint-disable no-console */

/**
 * Required environment variables:
 *  - CHAIN_ID
 *  - RPC_URL
 *  - PRIVATE_KEY
 *  - MIN_STAKED_AMOUNT (HMT)
 *  - MIN_STAKED_DAYS
 *  - STAKED_AMOUNT_INCREMENT (HMT)
 *  - BONUS_PERCENTAGE_INCREMENT
 *  - MAX_BONUS_PERCENTAGE
 * Optional:
 *  - PAGE_SIZE (default: 1000)
 *  - SUBGRAPH_API_KEY
 */

import { ethers, NonceManager } from 'ethers';
import { ChainId, NETWORKS, StakingUtils } from '@human-protocol/sdk';
import { HMToken__factory } from '@human-protocol/core/typechain-types';

interface BonusConfig {
  CHAIN_ID: number;
  RPC_URL: string;
  PRIVATE_KEY: string;
  MIN_STAKED_AMOUNT: number;
  MIN_STAKED_DAYS: number;
  STAKED_AMOUNT_INCREMENT: number;
  BONUS_PERCENTAGE_INCREMENT: number;
  MAX_BONUS_PERCENTAGE: number;
  PAGE_SIZE?: number;
  SUBGRAPH_API_KEY?: string;
}

function loadConfig(): BonusConfig {
  const requireEnv = (name: string): string => {
    const v = process.env[name];
    if (v === undefined || v === '') {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return v;
  };
  const numberFromEnv = (name: string): number => {
    const raw = requireEnv(name);
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      throw new Error(`Environment variable ${name} must be a valid number`);
    }
    return n;
  };

  return {
    CHAIN_ID: numberFromEnv('BONUS_CHAIN_ID'),
    RPC_URL: requireEnv('BONUS_RPC_URL'),
    PRIVATE_KEY: requireEnv('BONUS_PRIVATE_KEY'),
    MIN_STAKED_AMOUNT: numberFromEnv('BONUS_MIN_STAKED_AMOUNT'),
    MIN_STAKED_DAYS: numberFromEnv('BONUS_MIN_STAKED_DAYS'),
    STAKED_AMOUNT_INCREMENT: numberFromEnv('BONUS_STAKED_AMOUNT_INCREMENT'),
    BONUS_PERCENTAGE_INCREMENT: numberFromEnv('BONUS_PERCENTAGE_INCREMENT'),
    MAX_BONUS_PERCENTAGE: numberFromEnv('BONUS_MAX_BONUS_PERCENTAGE'),
    PAGE_SIZE: Number(process.env.BONUS_PAGE_SIZE || '') || 1000,
  };
}

function formatHMTWei(amountWei: bigint): string {
  return ethers.formatUnits(amountWei, 18);
}

function computeBonusPercentage(
  stakedWei: bigint,
  minStakedWei: bigint,
  incrementWei: bigint,
  pctIncrement: number,
  maxPct: number
): number {
  if (stakedWei < minStakedWei) return 0;
  const over = stakedWei - minStakedWei;
  const brackets = incrementWei > 0n ? Number(over / incrementWei) : 0; // 0-based additional brackets
  const rawPct = pctIncrement * (brackets + 1); // first bracket
  return Math.min(rawPct, maxPct);
}

async function main() {
  const cfg = loadConfig();
  const chainId = cfg.CHAIN_ID as ChainId;
  const networkData = NETWORKS[chainId];
  if (!networkData) throw new Error(`Unsupported CHAIN_ID ${chainId}`);

  const provider = new ethers.JsonRpcProvider(cfg.RPC_URL, chainId);

  const baseWallet = new ethers.Wallet(cfg.PRIVATE_KEY, provider);
  const wallet = new NonceManager(baseWallet);
  const token = HMToken__factory.connect(networkData.hmtAddress, wallet);

  const decimals = 18;

  const minStakedWei = ethers.parseUnits(
    cfg.MIN_STAKED_AMOUNT.toString(),
    decimals
  );
  const incrementWei = ethers.parseUnits(
    cfg.STAKED_AMOUNT_INCREMENT.toString(),
    decimals
  );

  console.log('--- Staking Bonus Distribution ---');
  console.log(
    `chain=${chainId} minStaked=${cfg.MIN_STAKED_AMOUNT} minDays=${cfg.MIN_STAKED_DAYS} inc=${cfg.STAKED_AMOUNT_INCREMENT} bonusInc=${cfg.BONUS_PERCENTAGE_INCREMENT}% maxPct=${cfg.MAX_BONUS_PERCENTAGE}%`
  );

  // Fetch stakers in pages
  const eligible: {
    address: string;
    stakedAmountWei: bigint;
    bonusPct: number;
    bonusAmountWei: bigint;
  }[] = [];

  let skip = 0;
  const first = cfg.PAGE_SIZE || 1000;
  const nowSec = Math.floor(Date.now() / 1000);

  // Paginate until a page returns fewer than requested items
  for (;;) {
    const stakers = await StakingUtils.getStakers({
      chainId,
      first,
      skip,
      orderBy: 'lastDepositTimestamp',
    });
    if (!stakers.length) break;

    // Filter and compute directly: bonus is % of current stake
    stakers.forEach((staker) => {
      const stakedWei = BigInt(staker.stakedAmount || '0');
      const lastDepTs = staker.lastDepositTimestamp
        ? Number(staker.lastDepositTimestamp)
        : undefined;
      if (
        stakedWei < minStakedWei ||
        !lastDepTs ||
        (nowSec - lastDepTs) / 86400 < cfg.MIN_STAKED_DAYS
      ) {
        return;
      }
      const bonusPct = computeBonusPercentage(
        stakedWei,
        minStakedWei,
        incrementWei,
        cfg.BONUS_PERCENTAGE_INCREMENT,
        cfg.MAX_BONUS_PERCENTAGE
      );
      if (bonusPct <= 0) return;
      const bonusAmountWei = (stakedWei * BigInt(bonusPct)) / 100n;
      if (bonusAmountWei === 0n) return;
      eligible.push({
        address: staker.address,
        stakedAmountWei: stakedWei,
        bonusPct,
        bonusAmountWei,
      });
    });

    skip += first;
    if (stakers.length < first) break; // reached last page
  }

  if (!eligible.length) {
    console.log('No eligible stakers found.');
    return;
  }

  console.log(`Eligible: ${eligible.length}`);
  let totalBonusWei = 0n;
  for (const e of eligible) {
    totalBonusWei += e.bonusAmountWei;
    console.log(
      ` - ${e.address} | staked=${formatHMTWei(e.stakedAmountWei)} HMT | pct=${e.bonusPct}% | bonus=${formatHMTWei(e.bonusAmountWei)} HMT`
    );
  }
  console.log('Total bonus (HMT):', formatHMTWei(totalBonusWei));

  const balance: bigint = await token.balanceOf(await wallet.getAddress());
  if (balance < totalBonusWei) {
    throw new Error(
      `Insufficient HMT balance. Needed ${formatHMTWei(totalBonusWei)}, have ${formatHMTWei(balance)}`
    );
  }

  console.log('Sending transfers...');
  for (const e of eligible) {
    try {
      const tx = await token.transfer(e.address, e.bonusAmountWei);
      console.log(
        `Sent bonus to ${e.address}: ${formatHMTWei(e.bonusAmountWei)} HMT | tx=${tx.hash}`
      );
      await tx.wait();
    } catch (err) {
      console.error('Failed transfer to', e.address, err);
    }
  }
  console.log('Done.');
}

main().catch((e) => {
  console.error('Error executing bonus distribution script:', e);
  process.exit(1);
});
