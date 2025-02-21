import { faker } from '@faker-js/faker';
import { ChainId } from '@human-protocol/sdk';
import { ethers } from 'ethers';

export function generateEthWallet() {
  const wallet = ethers.Wallet.createRandom();

  return {
    privateKey: wallet.privateKey,
    address: wallet.address,
  };
}

export function generateTestnetChainId() {
  return faker.helpers.arrayElement([
    ChainId.BSC_TESTNET,
    ChainId.POLYGON_AMOY,
    ChainId.SEPOLIA,
  ]);
}
