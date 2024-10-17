import { newMockEvent } from 'matchstick-as/assembly/index';
import { Address, ethereum, BigInt, dataSource } from '@graphprotocol/graph-ts';

import {
  Transfer,
  Approval,
  BulkTransfer,
  BulkApproval,
} from '../../generated/HMToken/HMToken';
import { generateUniqueHash } from '../../tests/utils';

export function createTransferEvent(
  from: string,
  to: string,
  value: i32,
  timestamp: BigInt
): Transfer {
  const transferEvent = changetype<Transfer>(newMockEvent());
  transferEvent.transaction.hash = generateUniqueHash(
    to,
    timestamp,
    transferEvent.transaction.nonce
  );

  transferEvent.parameters = [];
  transferEvent.transaction.from = Address.fromString(from);
  transferEvent.transaction.to = Address.fromString(
    dataSource.address().toHexString()
  );
  transferEvent.block.timestamp = timestamp;
  const fromParam = new ethereum.EventParam(
    '_from',
    ethereum.Value.fromAddress(Address.fromString(from))
  );
  const toParam = new ethereum.EventParam(
    '_to',
    ethereum.Value.fromAddress(Address.fromString(to))
  );
  const valueParam = new ethereum.EventParam(
    '_value',
    ethereum.Value.fromI32(value)
  );

  transferEvent.parameters.push(fromParam);
  transferEvent.parameters.push(toParam);
  transferEvent.parameters.push(valueParam);

  return transferEvent;
}

export function createApprovalEvent(
  spender: string,
  owner: string,
  value: i32,
  timestamp: BigInt
): Approval {
  const approvalEvent = changetype<Approval>(newMockEvent());
  approvalEvent.transaction.hash = generateUniqueHash(
    owner,
    timestamp,
    approvalEvent.transaction.nonce
  );

  approvalEvent.transaction.from = Address.fromString(spender);
  approvalEvent.transaction.to = Address.fromString(
    dataSource.address().toHexString()
  );
  approvalEvent.parameters = [];
  approvalEvent.block.timestamp = timestamp;
  const ownerParam = new ethereum.EventParam(
    '_spender',
    ethereum.Value.fromAddress(Address.fromString(spender))
  );
  const spenderParam = new ethereum.EventParam(
    '_owner',
    ethereum.Value.fromAddress(Address.fromString(owner))
  );
  const valueParam = new ethereum.EventParam(
    '_value',
    ethereum.Value.fromI32(value)
  );

  approvalEvent.parameters.push(ownerParam);
  approvalEvent.parameters.push(spenderParam);
  approvalEvent.parameters.push(valueParam);

  return approvalEvent;
}

export function createBulkTransferEvent(
  txId: i32,
  bulkCount: i32,
  timestamp: BigInt
): BulkTransfer {
  const bulkTransferEvent = changetype<BulkTransfer>(newMockEvent());
  bulkTransferEvent.transaction.hash = generateUniqueHash(
    bulkCount.toString(),
    timestamp,
    bulkTransferEvent.transaction.nonce
  );
  bulkTransferEvent.transaction.to = Address.fromString(
    dataSource.address().toHexString()
  );

  bulkTransferEvent.parameters = [];
  bulkTransferEvent.block.timestamp = timestamp;
  const txIdParam = new ethereum.EventParam(
    '_txId',
    ethereum.Value.fromI32(txId)
  );
  const bulkCountParam = new ethereum.EventParam(
    '_bulkCount',
    ethereum.Value.fromI32(bulkCount)
  );

  bulkTransferEvent.parameters.push(txIdParam);
  bulkTransferEvent.parameters.push(bulkCountParam);

  return bulkTransferEvent;
}

export function createBulkApprovalEvent(
  txId: i32,
  bulkCount: i32,
  timestamp: BigInt
): BulkApproval {
  const bulkApprovalEvent = changetype<BulkApproval>(newMockEvent());
  bulkApprovalEvent.transaction.hash = generateUniqueHash(
    bulkCount.toString(),
    timestamp,
    bulkApprovalEvent.transaction.nonce
  );

  bulkApprovalEvent.transaction.to = Address.fromString(
    dataSource.address().toHexString()
  );

  bulkApprovalEvent.parameters = [];
  bulkApprovalEvent.block.timestamp = timestamp;
  const txIdParam = new ethereum.EventParam(
    '_txId',
    ethereum.Value.fromI32(txId)
  );
  const bulkCountParam = new ethereum.EventParam(
    '_bulkCount',
    ethereum.Value.fromI32(bulkCount)
  );

  bulkApprovalEvent.parameters.push(txIdParam);
  bulkApprovalEvent.parameters.push(bulkCountParam);

  return bulkApprovalEvent;
}
