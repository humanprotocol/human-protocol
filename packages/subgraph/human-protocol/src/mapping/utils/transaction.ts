import { Address, BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts';
import { Transaction, InternalTransaction } from '../../../generated/schema';
import { toEventId, toPreviousEventId } from './event';

const mainMethods: string[] = [
  'createEscrow',
  'setup',
  'requestCancellation',
  'withdraw',
  'fund',
  'cancel',
  'complete',
  'storeResults',
  'bulkTransfer',
  'stake',
  'unstake',
  'slash',
  'stakeWithdrawn',
  'withdrawFees',
  'approve',
];

function createInternalTransaction(
  id: Bytes,
  transactionId: Bytes,
  method: string,
  from: Bytes,
  to: Bytes,
  value: BigInt,
  receiver: Bytes | null = null,
  escrow: Bytes | null = null,
  token: Bytes | null = null
): void {
  const internalTransaction = new InternalTransaction(id);
  internalTransaction.method = method;
  internalTransaction.from = from;
  internalTransaction.to = to;
  internalTransaction.value = value;
  internalTransaction.transaction = transactionId;
  internalTransaction.token = token;
  internalTransaction.escrow = escrow;
  internalTransaction.receiver = receiver;
  internalTransaction.save();
}

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
  const transactionTo = Address.fromBytes(event.transaction.to!);
  const isMainMethod = mainMethods.includes(method);
  // Escrow finalization can emit token transfers before the status event, so
  // keep those transfers internal until cancel/complete can claim the tx.
  const isEscrowScopedInternal =
    escrow !== null &&
    transactionTo == escrow &&
    transactionTo != to &&
    !isMainMethod;
  const zeroValue = BigInt.fromI32(0);

  if (transaction == null) {
    transaction = new Transaction(event.transaction.hash);
    transaction.txHash = event.transaction.hash;
    transaction.block = event.block.number;
    transaction.timestamp = event.block.timestamp;
    transaction.from = from;
    transaction.to = event.transaction.to!;

    if (isEscrowScopedInternal) {
      transaction.method = 'multimethod';
      transaction.value = zeroValue;
      transaction.token = null;
      transaction.escrow = escrow;
      transaction.receiver = null;

      createInternalTransaction(
        toEventId(event, method),
        transaction.txHash,
        method,
        from,
        to,
        value !== null ? value : zeroValue,
        receiver,
        escrow,
        token
      );
    } else if (
      transactionTo != to &&
      (escrow === null || Address.fromBytes(transaction.to) != escrow) &&
      (token === null || Address.fromBytes(transaction.to) != token)
    ) {
      transaction.method = 'multimethod';
      transaction.value = zeroValue;
      transaction.token = null;
      transaction.escrow = null;

      createInternalTransaction(
        toEventId(event, method),
        transaction.txHash,
        method,
        from,
        to,
        value !== null ? value : zeroValue,
        receiver,
        escrow,
        token
      );
    } else {
      transaction.to = to;
      transaction.method = method;
      transaction.value = value !== null ? value : zeroValue;
      transaction.token = token;
      transaction.escrow = escrow;
      transaction.receiver = receiver;
    }
    transaction.save();
  } else if (isMainMethod && Address.fromBytes(transaction.to) == to) {
    if (mainMethods.includes(transaction.method)) {
      createInternalTransaction(
        toEventId(event, method),
        transaction.txHash,
        method,
        from,
        to,
        value !== null ? value : zeroValue,
        receiver,
        escrow,
        token
      );
    } else {
      transaction.method = method;
      transaction.from = from;
      transaction.value = value !== null ? value : zeroValue;
      transaction.token = token;
      transaction.escrow = escrow;
      transaction.receiver = receiver;
      transaction.save();
    }
  } else {
    if (
      transaction.method == 'set' &&
      method == 'set' &&
      transaction.to == to
    ) {
      createInternalTransaction(
        toPreviousEventId(event),
        transaction.txHash,
        transaction.method,
        transaction.from,
        Address.fromBytes(transaction.to),
        transaction.value
      );

      transaction.method = 'setBulk';
      transaction.save();
    }

    createInternalTransaction(
      toEventId(event, method),
      transaction.txHash,
      method,
      from,
      to,
      value !== null ? value : event.transaction.value,
      receiver,
      escrow,
      token
    );
  }

  return transaction;
}
