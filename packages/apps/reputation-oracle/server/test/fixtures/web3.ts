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

export type SignerMock = jest.Mocked<Pick<Wallet, 'sendTransaction'>> & {
  __transactionResponse: {
    wait: jest.Mock;
  };
};

export function createSignerMock(): SignerMock {
  const transactionResponse = {
    wait: jest.fn(),
  };

  return {
    sendTransaction: jest.fn().mockResolvedValue(transactionResponse),
    __transactionResponse: transactionResponse,
  };
}
