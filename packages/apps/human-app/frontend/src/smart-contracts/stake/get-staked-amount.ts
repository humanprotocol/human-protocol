import { FakeSmartContract } from '@/smart-contracts/stake/fake-stake-smart-contract';

export function getStackedAmount({ address }: { address: string }) {
  // TODO add smart contract integration
  address;
  return FakeSmartContract.getInstance().getStack();
}
