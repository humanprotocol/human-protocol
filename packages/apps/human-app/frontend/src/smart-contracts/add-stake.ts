import { FakeSmartContract } from '@/smart-contracts/fake-smart-contract';

export function addStake({
  address,
  amount,
}: {
  address: string;
  amount: number;
}) {
  // TODO add smart contract integration
  address;
  amount;
  return FakeSmartContract.getInstance().setStack(amount);
}
