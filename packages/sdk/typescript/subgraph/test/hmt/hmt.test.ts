import { BigInt } from '@graphprotocol/graph-ts';
import { describe, test, assert, clearStore } from 'matchstick-as/assembly';

import {
  handleApproval,
  handleTransfer,
  HMT_STATISTICS_ENTITY_ID,
} from '../../src/mapping/HMToken';
import { createApprovalEvent, createTransferEvent } from './fixtures';

describe('HMToken entity', () => {
  test('Should properly calculate Transfer event in statistics', () => {
    const transfer1 = createTransferEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      1,
      BigInt.fromI32(10)
    );
    const transfer2 = createTransferEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      2,
      BigInt.fromI32(10)
    );

    handleTransfer(transfer1);
    handleTransfer(transfer2);

    assert.fieldEquals(
      'HMTokenStatistics',
      HMT_STATISTICS_ENTITY_ID,
      'totalTransferEventCount',
      '2'
    );
    assert.fieldEquals(
      'HMTokenStatistics',
      HMT_STATISTICS_ENTITY_ID,
      'totalValueTransfered',
      '3'
    );
    clearStore();
  });
});

describe('HMToken entity', () => {
  test('Should properly index Transfer events', () => {
    const transfer1 = createTransferEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      1,
      BigInt.fromI32(10)
    );
    const transfer2 = createTransferEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      2,
      BigInt.fromI32(11)
    );

    handleTransfer(transfer1);
    handleTransfer(transfer2);

    const id1 = `${transfer1.transaction.hash.toHex()}-${transfer1.logIndex.toString()}-${
      transfer1.block.timestamp
    }`;
    const id2 = `${transfer2.transaction.hash.toHex()}-${transfer2.logIndex.toString()}-${
      transfer2.block.timestamp
    }`;

    // Trasnfer 1
    assert.fieldEquals('HMTransferEvent', id1, 'timestamp', '10');
    assert.fieldEquals(
      'HMTransferEvent',
      id1,
      'block',
      transfer1.block.number.toString()
    );
    assert.fieldEquals(
      'HMTransferEvent',
      id1,
      'token',
      transfer1.address.toHexString()
    );
    assert.fieldEquals(
      'HMTransferEvent',
      id1,
      'from',
      transfer1.params._from.toHexString()
    );
    assert.fieldEquals(
      'HMTransferEvent',
      id1,
      'to',
      transfer1.params._to.toHexString()
    );
    assert.fieldEquals(
      'HMTransferEvent',
      id1,
      'value',
      transfer1.params._value.toString()
    );
    assert.fieldEquals(
      'HMTransferEvent',
      id1,
      'transaction',
      transfer1.transaction.hash.toHexString()
    );

    // Trasnfer 2
    assert.fieldEquals('HMTransferEvent', id2, 'timestamp', '11');
    assert.fieldEquals(
      'HMTransferEvent',
      id2,
      'block',
      transfer2.block.number.toString()
    );
    assert.fieldEquals(
      'HMTransferEvent',
      id2,
      'token',
      transfer2.address.toHexString()
    );
    assert.fieldEquals(
      'HMTransferEvent',
      id2,
      'from',
      transfer2.params._from.toHexString()
    );
    assert.fieldEquals(
      'HMTransferEvent',
      id2,
      'to',
      transfer2.params._to.toHexString()
    );
    assert.fieldEquals(
      'HMTransferEvent',
      id2,
      'value',
      transfer2.params._value.toString()
    );
    assert.fieldEquals(
      'HMTransferEvent',
      id2,
      'transaction',
      transfer2.transaction.hash.toHexString()
    );
    assert.fieldEquals('HMTransferEvent', id2, 'count', '2');

    clearStore();
  });
});
describe('HMToken entity', () => {
  test('Should properly index approval events', () => {
    const approval1 = createApprovalEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      1,
      BigInt.fromI32(10)
    );
    const approval2 = createApprovalEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      2,
      BigInt.fromI32(11)
    );

    handleApproval(approval1);
    handleApproval(approval2);

    const id1 = `${approval1.transaction.hash.toHex()}-${approval1.logIndex.toString()}-${
      approval1.block.timestamp
    }`;
    const id2 = `${approval2.transaction.hash.toHex()}-${approval2.logIndex.toString()}-${
      approval2.block.timestamp
    }`;

    // Trasnfer 1
    assert.fieldEquals('HMApprovalEvent', id1, 'timestamp', '10');
    assert.fieldEquals(
      'HMApprovalEvent',
      id1,
      'block',
      approval1.block.number.toString()
    );
    assert.fieldEquals(
      'HMApprovalEvent',
      id1,
      'token',
      approval1.address.toHexString()
    );
    assert.fieldEquals(
      'HMApprovalEvent',
      id1,
      'spender',
      approval1.params._spender.toHexString()
    );
    assert.fieldEquals(
      'HMApprovalEvent',
      id1,
      'owner',
      approval1.params._owner.toHexString()
    );
    assert.fieldEquals(
      'HMApprovalEvent',
      id1,
      'value',
      approval1.params._value.toString()
    );
    assert.fieldEquals(
      'HMApprovalEvent',
      id1,
      'transaction',
      approval1.transaction.hash.toHexString()
    );
    assert.fieldEquals('HMApprovalEvent', id1, 'count', '1');

    // Trasnfer 2
    assert.fieldEquals('HMApprovalEvent', id2, 'timestamp', '11');
    assert.fieldEquals(
      'HMApprovalEvent',
      id2,
      'block',
      approval2.block.number.toString()
    );
    assert.fieldEquals(
      'HMApprovalEvent',
      id2,
      'token',
      approval2.address.toHexString()
    );
    assert.fieldEquals(
      'HMApprovalEvent',
      id2,
      'owner',
      approval2.params._owner.toHexString()
    );
    assert.fieldEquals(
      'HMApprovalEvent',
      id2,
      'spender',
      approval2.params._spender.toHexString()
    );
    assert.fieldEquals(
      'HMApprovalEvent',
      id2,
      'value',
      approval2.params._value.toString()
    );
    assert.fieldEquals(
      'HMApprovalEvent',
      id2,
      'transaction',
      approval2.transaction.hash.toHexString()
    );
    assert.fieldEquals('HMApprovalEvent', id2, 'count', '2');
    clearStore();
  });
});

describe('HMToken entity', () => {
  test('Should properly calculate holders in statistics', () => {
    const transfer1 = createTransferEvent(
      '0x0000000000000000000000000000000000000000',
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      1,
      BigInt.fromI32(10)
    );
    const transfer2 = createTransferEvent(
      '0x0000000000000000000000000000000000000000',
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      2,
      BigInt.fromI32(10)
    );

    handleTransfer(transfer1);
    handleTransfer(transfer2);

    assert.fieldEquals(
      'HMTokenStatistics',
      HMT_STATISTICS_ENTITY_ID,
      'holders',
      '2'
    );

    clearStore();
  });
});

describe('HMToken entity', () => {
  test('Should properly calculate holders in statistics', () => {
    const transfer1 = createTransferEvent(
      '0x0000000000000000000000000000000000000000',
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      10,
      BigInt.fromI32(10)
    );
    const transfer2 = createTransferEvent(
      '0x0000000000000000000000000000000000000000',
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      10,
      BigInt.fromI32(10)
    );
    const transfer3 = createTransferEvent(
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      10,
      BigInt.fromI32(10)
    );

    handleTransfer(transfer1);
    handleTransfer(transfer2);
    handleTransfer(transfer3);

    assert.fieldEquals(
      'HMTokenStatistics',
      HMT_STATISTICS_ENTITY_ID,
      'holders',
      '1'
    );

    clearStore();
  });
});

test('Should properly calculate holders in statistics', () => {
  const transfer1 = createTransferEvent(
    '0x0000000000000000000000000000000000000000',
    '0x92a2eEF7Ff696BCef98957a0189872680600a959',
    10,
    BigInt.fromI32(10)
  );

  const transfer2 = createTransferEvent(
    '0x92a2eEF7Ff696BCef98957a0189872680600a959',
    '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
    0,
    BigInt.fromI32(10)
  );

  handleTransfer(transfer1);
  handleTransfer(transfer2);

  assert.fieldEquals(
    'HMTokenStatistics',
    HMT_STATISTICS_ENTITY_ID,
    'holders',
    '1'
  );

  const transfer3 = createTransferEvent(
    '0x0000000000000000000000000000000000000000',
    '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
    10,
    BigInt.fromI32(10)
  );

  handleTransfer(transfer3);

  assert.fieldEquals(
    'HMTokenStatistics',
    HMT_STATISTICS_ENTITY_ID,
    'holders',
    '2'
  );

  const transfer4 = createTransferEvent(
    '0x92a2eEF7Ff696BCef98957a0189872680600a959',
    '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
    10,
    BigInt.fromI32(10)
  );

  handleTransfer(transfer4);

  assert.fieldEquals(
    'HMTokenStatistics',
    HMT_STATISTICS_ENTITY_ID,
    'holders',
    '1'
  );

  clearStore();
});
