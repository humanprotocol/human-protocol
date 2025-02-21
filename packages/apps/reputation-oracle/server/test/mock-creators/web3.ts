import { Provider } from 'ethers';

export function createMockProvider(): jest.Mocked<
  Pick<Provider, 'getFeeData'>
> {
  return {
    getFeeData: jest.fn(),
  };
}
