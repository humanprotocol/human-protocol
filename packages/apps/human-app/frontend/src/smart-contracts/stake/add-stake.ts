import { FakeSmartContract } from '@/smart-contracts/stake/fake-stake-smart-contract';

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
