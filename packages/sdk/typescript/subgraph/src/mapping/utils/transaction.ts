/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { Transaction, InternalTransaction } from '../../../generated/schema';
import { toEventId, toPreviousEventId } from './event';

const mainMethods: string[] = [
  'createEscrow',
  'setup',
  'fund',
  'bulkTransfer',
  'storeResults',
  'withdraw',
  'cancel',
  'stake',
  'unstake',
  'slash',
  'stakeWithdrawn',
  'withdrawFees',
  'approve',
];

export function createTransaction(
  event: ethereum.Event,
  method: string,
  from: Address,
  to: Address,
  receiver: Address | null = null,
  escrow: Address | null = null,
  value: BigInt | null = null,
  token: Address | null = null
): Transaction {
  let transaction = Transaction.load(event.transaction.hash);
  if (transaction == null) {
    transaction = new Transaction(event.transaction.hash);
    transaction.txHash = event.transaction.hash;
    transaction.block = event.block.number;
    transaction.timestamp = event.block.timestamp;
    transaction.from = from;
    transaction.to = event.transaction.to!;

    if (
      Address.fromBytes(transaction.to) != to &&
      (escrow === null || Address.fromBytes(transaction.to) != escrow) &&
      (token === null || Address.fromBytes(transaction.to) != token)
    ) {
      transaction.method = 'multimethod';
      transaction.value = BigInt.fromI32(0);
      transaction.token = null;
      transaction.escrow = null;

      const internalTransaction = new InternalTransaction(toEventId(event));
      internalTransaction.method = method;
      internalTransaction.from = from;
      internalTransaction.to = to;
      internalTransaction.value = value !== null ? value : BigInt.fromI32(0);
      internalTransaction.transaction = transaction.txHash;
      internalTransaction.token = token;
      internalTransaction.escrow = escrow;
      internalTransaction.receiver = receiver;
      internalTransaction.save();
    } else {
      transaction.to = to;
      transaction.method = method;
      transaction.value = value !== null ? value : BigInt.fromI32(0);
      transaction.token = token;
      transaction.escrow = escrow;
      transaction.receiver = receiver;
    }
    transaction.save();
  } else if (
    mainMethods.includes(method) &&
    Address.fromBytes(transaction.to) == to
  ) {
    transaction.method = method;
    transaction.value = value !== null ? value : BigInt.fromI32(0);
    transaction.token = token;
    transaction.escrow = escrow;
    transaction.receiver = receiver;
    transaction.save();
  } else {
    if (
      transaction.method == 'set' &&
      method == 'set' &&
      transaction.to == to
    ) {
      const internalTransaction = new InternalTransaction(
        toPreviousEventId(event)
      );
      internalTransaction.method = transaction.method;
      internalTransaction.from = transaction.from;
      internalTransaction.to = transaction.to;
      internalTransaction.value = transaction.value;
      internalTransaction.transaction = transaction.txHash;
      internalTransaction.save();

      transaction.method = 'setBulk';
      transaction.save();
    }

    const internalTransaction = new InternalTransaction(toEventId(event));
    internalTransaction.method = method;
    internalTransaction.from = from;
    internalTransaction.to = to;
    internalTransaction.value =
      value !== null ? value : event.transaction.value;
    internalTransaction.transaction = transaction.txHash;
    internalTransaction.token = token;
    internalTransaction.escrow = escrow;
    internalTransaction.receiver = receiver;
    internalTransaction.save();
  }

  return transaction;
}
