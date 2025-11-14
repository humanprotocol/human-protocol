import { faker } from '@faker-js/faker/.';
import { NonceManager } from 'ethers';

export function createSignerMock() {
  const transactionResponse = {
    wait: jest.fn(),
  };

  return {
    sendTransaction: jest.fn().mockResolvedValue(transactionResponse),
    getAddress: jest.fn().mockResolvedValue(faker.finance.ethereumAddress()),
  } as unknown as jest.Mocked<NonceManager>;
}
