import { faker } from '@faker-js/faker';
import { ChainId } from '@human-protocol/sdk';
import { ethers, Wallet } from 'ethers';

export const TEST_PRIVATE_KEY =
  '0x85dc77260240f78982bdfdfc0a0cb241a85d2f9833468fae7ec362ec7829ce3a';
export const TEST_ADDRESS = '0x9dfB81606Af98a4776a28Ae0Ae30DA3567ae4B98';

export function generateEthWallet(privateKey?: string) {
  const wallet = privateKey
    ? new Wallet(privateKey)
    : ethers.Wallet.createRandom();

  return {
    privateKey: wallet.privateKey,
    address: wallet.address,
  };
}

export function generateContractAddress() {
  return ethers.getCreateAddress({
    from: generateEthWallet().address,
    nonce: faker.number.bigInt(),
  });
}

export function generateTestnetChainId() {
  return faker.helpers.arrayElement([
    ChainId.BSC_TESTNET,
    ChainId.POLYGON_AMOY,
    ChainId.SEPOLIA,
  ]);
}
