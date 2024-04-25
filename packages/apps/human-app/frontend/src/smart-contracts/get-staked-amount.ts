// TODO replace by smart contract instance created with ethers.js
import { FakeSmartContract } from '@/smart-contracts/fake-smart-contract';

export function getStackedAmount({ address }: { address: string }) {
  // TODO add smart contract integration
  address;
  return FakeSmartContract.getInstance().getStack();
}
