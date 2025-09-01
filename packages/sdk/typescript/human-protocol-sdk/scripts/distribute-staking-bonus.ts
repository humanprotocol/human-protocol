#!/usr/bin/env ts-node
/* eslint-disable no-console */
/*
  Staking bonus distributor.
  - Eligibility: staked >= MIN_STAKED_AMOUNT AND days since last deposit >= MIN_STAKED_DAYS.
  - Bonus base: current staked amount (not historical earnings).
  - Brackets: every STAKED_AMOUNT_INCREMENT above MIN_STAKED_AMOUNT adds BONUS_PERCENTAGE_INCREMENT %, capped by MAX_BONUS_PERCENTAGE.
  - Bonus = staked * bonusPct / 100.
*/

import { ethers, NonceManager } from 'ethers';
import { ChainId, NETWORKS, StakingUtils } from '@human-protocol/sdk';
import { HMToken__factory } from '@human-protocol/core/typechain-types';

// ---------- Types ----------
interface BonusConfig {
  CHAIN_ID: number;
  RPC_URL: string;
  PRIVATE_KEY: string;
  MIN_STAKED_AMOUNT: number; // expressed in HMT (not wei) for convenience
  MIN_STAKED_DAYS: number;
  STAKED_AMOUNT_INCREMENT: number; // in HMT
  BONUS_PERCENTAGE_INCREMENT: number;
  MAX_BONUS_PERCENTAGE: number;
  PAGE_SIZE?: number;
  SUBGRAPH_API_KEY?: string;
}

const LOCAL_CONFIG: BonusConfig = {
  CHAIN_ID: 80002, // Example: Polygon Amoy
  RPC_URL: 'https://YOUR_RPC_URL',
  PRIVATE_KEY: '0xYOUR_PRIVATE_KEY',
  MIN_STAKED_AMOUNT: 1, // HMT
  MIN_STAKED_DAYS: 7, // Minimum days since last deposit
  STAKED_AMOUNT_INCREMENT: 500, // HMT per bracket
  BONUS_PERCENTAGE_INCREMENT: 2, // Percentage increase per bracket (e.g. 2 => 2%, 4%, 6%, ...)
  MAX_BONUS_PERCENTAGE: 10, // Maximum allowed bonus percentage
  PAGE_SIZE: 500,
  SUBGRAPH_API_KEY: undefined,
};

// Load config from env (fallback to LOCAL_CONFIG)
function loadConfig(): BonusConfig {
  const num = (v: string | undefined, fallback: number): number =>
    v !== undefined && v !== '' ? Number(v) : fallback;
  return {
    CHAIN_ID: num(process.env.BONUS_CHAIN_ID, LOCAL_CONFIG.CHAIN_ID),
    RPC_URL: process.env.BONUS_RPC_URL || LOCAL_CONFIG.RPC_URL,
    PRIVATE_KEY: process.env.BONUS_PRIVATE_KEY || LOCAL_CONFIG.PRIVATE_KEY,
    MIN_STAKED_AMOUNT: num(
      process.env.BONUS_MIN_STAKED_AMOUNT,
      LOCAL_CONFIG.MIN_STAKED_AMOUNT
    ),
    MIN_STAKED_DAYS: num(
      process.env.BONUS_MIN_STAKED_DAYS,
      LOCAL_CONFIG.MIN_STAKED_DAYS
    ),
    STAKED_AMOUNT_INCREMENT: num(
      process.env.BONUS_STAKED_AMOUNT_INCREMENT,
      LOCAL_CONFIG.STAKED_AMOUNT_INCREMENT
    ),
    BONUS_PERCENTAGE_INCREMENT: num(
      process.env.BONUS_PERCENTAGE_INCREMENT,
      LOCAL_CONFIG.BONUS_PERCENTAGE_INCREMENT
    ),
    MAX_BONUS_PERCENTAGE: num(
      process.env.BONUS_MAX_BONUS_PERCENTAGE,
      LOCAL_CONFIG.MAX_BONUS_PERCENTAGE
    ),
    PAGE_SIZE: num(process.env.BONUS_PAGE_SIZE, LOCAL_CONFIG.PAGE_SIZE || 1000),
    SUBGRAPH_API_KEY:
      process.env.BONUS_SUBGRAPH_API_KEY || LOCAL_CONFIG.SUBGRAPH_API_KEY,
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
    `chain=${chainId} minStake=${cfg.MIN_STAKED_AMOUNT}d minDays=${cfg.MIN_STAKED_DAYS} inc=${cfg.STAKED_AMOUNT_INCREMENT} bonusInc=${cfg.BONUS_PERCENTAGE_INCREMENT}% maxPct=${cfg.MAX_BONUS_PERCENTAGE}%`
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
