import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { Transaction, InternalTransaction } from '../../../generated/schema';
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
    transaction.txHash = event.transaction.hash;
    transaction.block = event.block.number;
    transaction.timestamp = event.block.timestamp;
    transaction.method = method;
    transaction.from = event.transaction.from;
    transaction.to = event.transaction.to;
    transaction.token = token;
    transaction.value =
      value !== null ? BigInt.fromI32(0) : event.transaction.value;
  } else if (getPriorityMethod(transaction.method, method) == method) {
    transaction.method = method;
    transaction.from = event.transaction.from;
    transaction.to = event.transaction.to;
    transaction.token = token;
    transaction.value =
      value !== null ? BigInt.fromI32(0) : event.transaction.value;
  }

  if (transaction.method != method) {
    const internalTransaction = new InternalTransaction(toEventId(event));
    internalTransaction.from = event.transaction.from;
    internalTransaction.to = to !== null ? to : event.transaction.to;
    internalTransaction.value =
      value !== null ? BigInt.fromI32(0) : event.transaction.value;
    internalTransaction.transaction = transaction.id;
    internalTransaction.token = token;
    internalTransaction.save();
  }

  transaction.save();

  return transaction;
}

const priorityMethods: string[] = [
  'createEscrow',
  'setup',
  'fund',
  'bulkTransfer',
  'complete',
  'sotoreResults',
  'withdraw',
  'cancel',
  'stake',
  'unstake',
  'slash',
  'allocate',
  'closeAllocation',
  'addReward',
  'stakeWithdrawn',
  'set',
  'approve',
  'increaseApprovalBulk',
  'transfer',
];

function getPriorityMethod(existingMethod: string, newMethod: string): string {
  if (!existingMethod) return newMethod;

  const existingIndex = getMethodIndex(existingMethod);
  const newIndex = getMethodIndex(newMethod);

  if (newIndex < 0) {
    return existingMethod;
  }

  return newIndex < existingIndex ? newMethod : existingMethod;
}

function getMethodIndex(eventName: string): number {
  return priorityMethods.indexOf(eventName);
}
