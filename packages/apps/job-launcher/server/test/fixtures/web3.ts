import { Wallet } from 'ethers';

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
