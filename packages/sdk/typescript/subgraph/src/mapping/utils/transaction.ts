import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { Transaction } from '../../../generated/schema';

export function createTransaction(
  event: ethereum.Event,
  method: string,
  to: Address | null = null,
  value: BigInt | null = null
): void {
  const transaction = new Transaction(event.transaction.hash.toHex());

  transaction.from = event.transaction.from;
  transaction.to = to !== null ? to : event.transaction.to;
  transaction.txHash = event.transaction.hash;
  transaction.block = event.block.number;
  transaction.timestamp = event.block.timestamp;
  transaction.value = value !== null ? value : event.transaction.value;
  transaction.method = method;

  transaction.save();
}
