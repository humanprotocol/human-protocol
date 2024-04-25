import { FakeSmartContract } from '@/smart-contracts/keys/fake-keys-smart-contract';

export function getExistingKeys({ address }: { address: string }) {
  // TODO add smart contract integration
  address;
  return FakeSmartContract.getInstance().getExistingKeys();
}

export function getPendingKeys({ address }: { address: string }) {
  // TODO add smart contract integration
  address;
  return FakeSmartContract.getInstance().getPendingKeys();
}
