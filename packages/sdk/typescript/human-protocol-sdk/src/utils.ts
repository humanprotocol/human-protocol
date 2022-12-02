import { BigNumber, ethers } from 'ethers';

import {
  Escrow,
  Escrow__factory,
  EscrowFactory,
  EscrowFactory__factory,
  HMToken,
  HMToken__factory,
} from '@human-protocol/core/typechain-types';

/**
 * **Get HMToken contract instance at given address**
 *
 * @param {string} hmTokenAddr HMToken contract address
 * @param {ethers.Signer | undefined} signer Deployer signer
 * @returns {Promise<HMToken>} Attached contract instance
 */
export const getHmToken = async (
  hmTokenAddr: string,
  signer?: ethers.Signer
): Promise<HMToken> => {
  const factory = new HMToken__factory(signer);

  const contract = await factory.attach(hmTokenAddr);

  return contract;
};

/**
 * **Deploy EscrowFactory contract**
 *
 * @param {string} hmTokenAddr HMToken address
 * @param {ethers.Signer | undefined} signer Deployer signer
 * @returns {Promise<EscrowFactory>} Deployed contract instance
 */
export const deployEscrowFactory = async (
  hmTokenAddr: string,
  signer?: ethers.Signer
): Promise<EscrowFactory> => {
  const factory = new EscrowFactory__factory(signer);

  const contract = await factory.deploy(hmTokenAddr);

  return contract;
};

/**
 * **Get EscrowFactory contract instance at given address**
 *
 * @param {string} factoryAddr EscrowFactory contract address
 * @param {ethers.Signer | undefined} signer Deployer signer
 * @returns {Promise<EscrowFactory>} Attached contract instance
 */
export const getEscrowFactory = async (
  factoryAddr: string,
  signer?: ethers.Signer
): Promise<EscrowFactory> => {
  const factory = new EscrowFactory__factory(signer);

  const contract = await factory.attach(factoryAddr);

  return contract;
};

/**
 * **Get Escrow contract instance at given address**
 *
 * @param {string} escrowAddr Escrow contract address
 * @param {ethers.Signer | undefined} signer Deployer signer
 * @returns {Promise<Escrow>} Attached contract instance
 */
export const getEscrow = async (
  escrowAddr: string,
  signer?: ethers.Signer
): Promise<Escrow> => {
  const factory = new Escrow__factory(signer);

  const contract = await factory.attach(escrowAddr);

  return contract;
};

/**
 * **Get specific amount representation in given decimals**
 *
 * Apply given decimals to the specified amount.
 *
 * @param {string | number} amount - Amount to convert
 * @param {number} decimals - Decimal to convert
 * @returns {BigNumber} Converted amount
 */
export const toFullDigit = (
  amount: number | string,
  decimals = 18
): BigNumber => {
  return BigNumber.from(amount).mul(BigNumber.from(10).pow(decimals));
};
