/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { Transaction, InternalTransaction } from '../../../generated/schema';
import { toEventId } from './event';

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
      internalTransaction.transaction = transaction.id;
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
    escrow !== null &&
    Address.fromBytes(transaction.to) == escrow
  ) {
    transaction.method = method;
    transaction.value = value !== null ? value : BigInt.fromI32(0);
    transaction.token = token;
    transaction.escrow = escrow;
    transaction.receiver = receiver;
    transaction.save();
  } else {
    const internalTransaction = new InternalTransaction(toEventId(event));
    internalTransaction.method = method;
    internalTransaction.from = from;
    internalTransaction.to = to;
    internalTransaction.value =
      value !== null ? value : event.transaction.value;
    internalTransaction.transaction = transaction.id;
    internalTransaction.token = token;
    internalTransaction.escrow = escrow;
    internalTransaction.receiver = receiver;
    internalTransaction.save();
  }

  return transaction;
}

const mainMethods: string[] = [
  'createEscrow',
  'setup',
  'fund',
  'bulkTransfer',
  'complete',
  'storeResults',
  'withdraw',
  'cancel',
  'stake',
  // 'stake',
  // 'unstake',
  // 'slash',
  // 'allocate',
  // 'closeAllocation',
  // 'addReward',
  // 'stakeWithdrawn',
  // 'set',
  // 'approve',
  // 'increaseApprovalBulk',
];
