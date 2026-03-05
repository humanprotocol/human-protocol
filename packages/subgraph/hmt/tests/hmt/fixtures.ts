import { newMockEvent } from 'matchstick-as/assembly/index';
import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';

import {
  Transfer,
  Approval,
  BulkTransfer,
  BulkApproval,
} from '../../generated/HMToken/HMToken';
import { generateUniqueHash } from '../../tests/utils';

const TOKEN_ADDRESS = '0xa16081f360e3847006db660bae1c6d1b2e17ffaa';

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
  transferEvent.transaction.from = Address.fromString(from);
  transferEvent.transaction.to = Address.fromString(TOKEN_ADDRESS);
  transferEvent.block.timestamp = timestamp;
  transferEvent.block.number = timestamp;

  transferEvent.parameters = [];
  transferEvent.parameters.push(
    new ethereum.EventParam(
      '_from',
      ethereum.Value.fromAddress(Address.fromString(from))
    )
  );
  transferEvent.parameters.push(
    new ethereum.EventParam(
      '_to',
      ethereum.Value.fromAddress(Address.fromString(to))
    )
  );
  transferEvent.parameters.push(
    new ethereum.EventParam('_value', ethereum.Value.fromI32(value))
  );

  return transferEvent;
}

export function createApprovalEvent(
  owner: string,
  spender: string,
  value: i32,
  timestamp: BigInt
): Approval {
  const approvalEvent = changetype<Approval>(newMockEvent());
  approvalEvent.transaction.hash = generateUniqueHash(
    owner,
    timestamp,
    approvalEvent.transaction.nonce
  );
  approvalEvent.transaction.from = Address.fromString(owner);
  approvalEvent.transaction.to = Address.fromString(TOKEN_ADDRESS);
  approvalEvent.block.timestamp = timestamp;
  approvalEvent.block.number = timestamp;

  approvalEvent.parameters = [];
  approvalEvent.parameters.push(
    new ethereum.EventParam(
      '_owner',
      ethereum.Value.fromAddress(Address.fromString(owner))
    )
  );
  approvalEvent.parameters.push(
    new ethereum.EventParam(
      '_spender',
      ethereum.Value.fromAddress(Address.fromString(spender))
    )
  );
  approvalEvent.parameters.push(
    new ethereum.EventParam('_value', ethereum.Value.fromI32(value))
  );

  return approvalEvent;
}

export function createBulkTransferEvent(
  txId: i32,
  bulkCount: i32,
  timestamp: BigInt
): BulkTransfer {
  const bulkTransferEvent = changetype<BulkTransfer>(newMockEvent());
  bulkTransferEvent.transaction.hash = generateUniqueHash(
    txId.toString(),
    timestamp,
    bulkTransferEvent.transaction.nonce
  );
  bulkTransferEvent.transaction.to = Address.fromString(TOKEN_ADDRESS);
  bulkTransferEvent.block.timestamp = timestamp;
  bulkTransferEvent.block.number = timestamp;

  bulkTransferEvent.parameters = [];
  bulkTransferEvent.parameters.push(
    new ethereum.EventParam('_txId', ethereum.Value.fromI32(txId))
  );
  bulkTransferEvent.parameters.push(
    new ethereum.EventParam('_bulkCount', ethereum.Value.fromI32(bulkCount))
  );

  return bulkTransferEvent;
}

export function createBulkApprovalEvent(
  txId: i32,
  bulkCount: i32,
  timestamp: BigInt
): BulkApproval {
  const bulkApprovalEvent = changetype<BulkApproval>(newMockEvent());
  bulkApprovalEvent.transaction.hash = generateUniqueHash(
    txId.toString(),
    timestamp,
    bulkApprovalEvent.transaction.nonce
  );
  bulkApprovalEvent.transaction.to = Address.fromString(TOKEN_ADDRESS);
  bulkApprovalEvent.block.timestamp = timestamp;
  bulkApprovalEvent.block.number = timestamp;

  bulkApprovalEvent.parameters = [];
  bulkApprovalEvent.parameters.push(
    new ethereum.EventParam('_txId', ethereum.Value.fromI32(txId))
  );
  bulkApprovalEvent.parameters.push(
    new ethereum.EventParam('_bulkCount', ethereum.Value.fromI32(bulkCount))
  );

  return bulkApprovalEvent;
}
