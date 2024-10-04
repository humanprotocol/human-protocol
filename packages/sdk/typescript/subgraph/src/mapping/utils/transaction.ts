import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { Transaction, Transfer } from '../../../generated/schema';
import { toEventId } from './event';

export function createTransaction(
  event: ethereum.Event,
  method: string,
  to: Address | null = null,
  value: BigInt | null = null,
  token: Address | null = null
): Transaction {
  let transaction = Transaction.load(event.transaction.hash);

  if (transaction == null) {
    transaction = new Transaction(event.transaction.hash);
    transaction.from = event.transaction.from;
    transaction.to = event.transaction.to;
    transaction.txHash = event.transaction.hash;
    transaction.block = event.block.number;
    transaction.timestamp = event.block.timestamp;
    transaction.value =
      value !== null ? BigInt.fromI32(0) : event.transaction.value;
    transaction.method = method;
    transaction.token = token;
  }

  if (method != 'transfer' && method != transaction.method) {
    transaction.method = method;
  }
  if (value) {
    transaction.value = transaction.value.plus(value);
  }

  if (method == 'transfer' || method == 'fund' || method == 'withdraw') {
    const transfer = new Transfer(toEventId(event));
    transfer.from = event.transaction.from;
    transfer.to = to !== null ? to : event.transaction.to;
    transfer.value = value !== null ? value : event.transaction.value;
    transfer.transaction = transaction.id;
    transfer.save();
  } else if (value) {
    transaction.value = value;
  }
  transaction.save();

  return transaction;
}
