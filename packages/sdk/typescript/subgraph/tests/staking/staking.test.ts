import { BigInt } from '@graphprotocol/graph-ts';
import { describe, test, assert, clearStore } from 'matchstick-as/assembly';

import {
  handleAllocationClosed,
  handleStakeAllocated,
  handleStakeDeposited,
  handleStakeLocked,
  handleStakeSlashed,
  handleStakeWithdrawn,
  STATISTICS_ENTITY_ID,
} from '../../src/mapping/Staking';
import {
  createAllocationClosedEvent,
  createStakeAllocatedEvent,
  createStakeDepositedEvent,
  createStakeLockedEvent,
  createStakeSlashedEvent,
  createStakeWithdrawnEvent,
} from './fixtures';

describe('Staking', () => {
  test('Should properly index StakingDeposited events', () => {
    const data1 = createStakeDepositedEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      100,
      BigInt.fromI32(10)
    );
    const data2 = createStakeDepositedEvent(
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      200,
      BigInt.fromI32(11)
    );

    handleStakeDeposited(data1);
    handleStakeDeposited(data2);

    const id1 = `${data1.transaction.hash.toHex()}-${data1.logIndex.toString()}-${
      data1.block.timestamp
    }`;
    const id2 = `${data2.transaction.hash.toHex()}-${data2.logIndex.toString()}-${
      data2.block.timestamp
    }`;

    // Data 1
    assert.fieldEquals(
      'StakeDepositedEvent',
      id1,
      'timestamp',
      data1.block.timestamp.toString()
    );
    assert.fieldEquals(
      'StakeDepositedEvent',
      id1,
      'block',
      data1.block.number.toString()
    );
    assert.fieldEquals(
      'StakeDepositedEvent',
      id1,
      'transaction',
      data1.transaction.hash.toHexString()
    );
    assert.fieldEquals(
      'StakeDepositedEvent',
      id1,
      'staker',
      data1.params.staker.toHexString()
    );
    assert.fieldEquals('StakeDepositedEvent', id1, 'amount', '100');

    // Data 2
    assert.fieldEquals(
      'StakeDepositedEvent',
      id2,
      'timestamp',
      data2.block.timestamp.toString()
    );
    assert.fieldEquals(
      'StakeDepositedEvent',
      id2,
      'block',
      data2.block.number.toString()
    );
    assert.fieldEquals(
      'StakeDepositedEvent',
      id2,
      'transaction',
      data2.transaction.hash.toHexString()
    );
    assert.fieldEquals(
      'StakeDepositedEvent',
      id2,
      'staker',
      data2.params.staker.toHexString()
    );
    assert.fieldEquals('StakeDepositedEvent', id2, 'amount', '200');

    // Leader statistics
    assert.fieldEquals(
      'LeaderStatistics',
      STATISTICS_ENTITY_ID,
      'leaders',
      '2'
    );

    // Leader
    assert.fieldEquals(
      'Leader',
      data1.params.staker.toHexString(),
      'amountStaked',
      '100'
    );
    assert.fieldEquals(
      'Leader',
      data2.params.staker.toHexString(),
      'amountStaked',
      '200'
    );
  });

  test('Should properly index StakeLocked events', () => {
    const data1 = createStakeLockedEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      50,
      30,
      BigInt.fromI32(20)
    );
    const data2 = createStakeLockedEvent(
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      100,
      31,
      BigInt.fromI32(21)
    );

    handleStakeLocked(data1);
    handleStakeLocked(data2);

    const id1 = `${data1.transaction.hash.toHex()}-${data1.logIndex.toString()}-${
      data1.block.timestamp
    }`;
    const id2 = `${data2.transaction.hash.toHex()}-${data2.logIndex.toString()}-${
      data2.block.timestamp
    }`;

    // Data 1
    assert.fieldEquals(
      'StakeLockedEvent',
      id1,
      'timestamp',
      data1.block.timestamp.toString()
    );
    assert.fieldEquals(
      'StakeLockedEvent',
      id1,
      'block',
      data1.block.number.toString()
    );
    assert.fieldEquals(
      'StakeLockedEvent',
      id1,
      'transaction',
      data1.transaction.hash.toHexString()
    );
    assert.fieldEquals(
      'StakeLockedEvent',
      id1,
      'staker',
      data1.params.staker.toHexString()
    );
    assert.fieldEquals('StakeLockedEvent', id1, 'amount', '50');
    assert.fieldEquals('StakeLockedEvent', id1, 'lockedUntilTimestamp', '30');

    // Data 2
    assert.fieldEquals(
      'StakeLockedEvent',
      id2,
      'timestamp',
      data2.block.timestamp.toString()
    );
    assert.fieldEquals(
      'StakeLockedEvent',
      id2,
      'block',
      data2.block.number.toString()
    );
    assert.fieldEquals(
      'StakeLockedEvent',
      id2,
      'transaction',
      data2.transaction.hash.toHexString()
    );
    assert.fieldEquals(
      'StakeLockedEvent',
      id2,
      'staker',
      data2.params.staker.toHexString()
    );
    assert.fieldEquals('StakeLockedEvent', id2, 'amount', '100');
    assert.fieldEquals('StakeLockedEvent', id2, 'lockedUntilTimestamp', '31');

    // Leader statistics
    assert.fieldEquals(
      'LeaderStatistics',
      STATISTICS_ENTITY_ID,
      'leaders',
      '2'
    );

    // Leader
    assert.fieldEquals(
      'Leader',
      data1.params.staker.toHexString(),
      'amountStaked',
      '100'
    );
    assert.fieldEquals(
      'Leader',
      data1.params.staker.toHexString(),
      'amountLocked',
      '50'
    );
    assert.fieldEquals(
      'Leader',
      data1.params.staker.toHexString(),
      'lockedUntilTimestamp',
      '30'
    );

    assert.fieldEquals(
      'Leader',
      data2.params.staker.toHexString(),
      'amountStaked',
      '200'
    );
    assert.fieldEquals(
      'Leader',
      data2.params.staker.toHexString(),
      'amountLocked',
      '100'
    );
    assert.fieldEquals(
      'Leader',
      data2.params.staker.toHexString(),
      'lockedUntilTimestamp',
      '31'
    );
  });

  test('Should properly index StakeWithdrawn events', () => {
    const data1 = createStakeWithdrawnEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      30,
      BigInt.fromI32(40)
    );
    const data2 = createStakeWithdrawnEvent(
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      100,
      BigInt.fromI32(41)
    );

    handleStakeWithdrawn(data1);
    handleStakeWithdrawn(data2);

    const id1 = `${data1.transaction.hash.toHex()}-${data1.logIndex.toString()}-${
      data1.block.timestamp
    }`;
    const id2 = `${data2.transaction.hash.toHex()}-${data2.logIndex.toString()}-${
      data2.block.timestamp
    }`;

    // Data 1
    assert.fieldEquals(
      'StakeWithdrawnEvent',
      id1,
      'timestamp',
      data1.block.timestamp.toString()
    );
    assert.fieldEquals(
      'StakeWithdrawnEvent',
      id1,
      'block',
      data1.block.number.toString()
    );
    assert.fieldEquals(
      'StakeWithdrawnEvent',
      id1,
      'transaction',
      data1.transaction.hash.toHexString()
    );
    assert.fieldEquals(
      'StakeWithdrawnEvent',
      id1,
      'staker',
      data1.params.staker.toHexString()
    );
    assert.fieldEquals('StakeWithdrawnEvent', id1, 'amount', '30');

    // Data 2
    assert.fieldEquals(
      'StakeWithdrawnEvent',
      id2,
      'timestamp',
      data2.block.timestamp.toString()
    );
    assert.fieldEquals(
      'StakeWithdrawnEvent',
      id2,
      'block',
      data2.block.number.toString()
    );
    assert.fieldEquals(
      'StakeWithdrawnEvent',
      id2,
      'transaction',
      data2.transaction.hash.toHexString()
    );
    assert.fieldEquals(
      'StakeWithdrawnEvent',
      id2,
      'staker',
      data2.params.staker.toHexString()
    );
    assert.fieldEquals('StakeWithdrawnEvent', id2, 'amount', '100');

    // Leader statistics
    assert.fieldEquals(
      'LeaderStatistics',
      STATISTICS_ENTITY_ID,
      'leaders',
      '2'
    );

    // Leader
    assert.fieldEquals(
      'Leader',
      data1.params.staker.toHexString(),
      'amountStaked',
      '70'
    );
    assert.fieldEquals(
      'Leader',
      data1.params.staker.toHexString(),
      'amountLocked',
      '20'
    );
    assert.fieldEquals(
      'Leader',
      data1.params.staker.toHexString(),
      'lockedUntilTimestamp',
      '30'
    );
    assert.fieldEquals(
      'Leader',
      data1.params.staker.toHexString(),
      'amountWithdrawn',
      '30'
    );

    assert.fieldEquals(
      'Leader',
      data2.params.staker.toHexString(),
      'amountStaked',
      '100'
    );
    assert.fieldEquals(
      'Leader',
      data2.params.staker.toHexString(),
      'amountLocked',
      '0'
    );
    assert.fieldEquals(
      'Leader',
      data2.params.staker.toHexString(),
      'lockedUntilTimestamp',
      '0'
    );
    assert.fieldEquals(
      'Leader',
      data2.params.staker.toHexString(),
      'amountWithdrawn',
      '100'
    );
  });

  test('Should properly index StakeAllocated events', () => {
    const data1 = createStakeAllocatedEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      30,
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC7',
      50,
      BigInt.fromI32(50)
    );
    const data2 = createStakeAllocatedEvent(
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      50,
      '0x92a2eEF7Ff696BCef98957a0189872680600a95A',
      51,
      BigInt.fromI32(51)
    );

    handleStakeAllocated(data1);
    handleStakeAllocated(data2);

    const id1 = `${data1.transaction.hash.toHex()}-${data1.logIndex.toString()}-${
      data1.block.timestamp
    }`;
    const id2 = `${data2.transaction.hash.toHex()}-${data2.logIndex.toString()}-${
      data2.block.timestamp
    }`;

    // Data 1
    assert.fieldEquals(
      'StakeAllocatedEvent',
      id1,
      'timestamp',
      data1.block.timestamp.toString()
    );
    assert.fieldEquals(
      'StakeAllocatedEvent',
      id1,
      'block',
      data1.block.number.toString()
    );
    assert.fieldEquals(
      'StakeAllocatedEvent',
      id1,
      'transaction',
      data1.transaction.hash.toHexString()
    );
    assert.fieldEquals(
      'StakeAllocatedEvent',
      id1,
      'staker',
      data1.params.staker.toHexString()
    );
    assert.fieldEquals('StakeAllocatedEvent', id1, 'amount', '30');
    assert.fieldEquals(
      'StakeAllocatedEvent',
      id1,
      'escrow',
      data1.params.escrowAddress.toHexString()
    );

    // Data 2
    assert.fieldEquals(
      'StakeAllocatedEvent',
      id2,
      'timestamp',
      data2.block.timestamp.toString()
    );
    assert.fieldEquals(
      'StakeAllocatedEvent',
      id2,
      'block',
      data2.block.number.toString()
    );
    assert.fieldEquals(
      'StakeAllocatedEvent',
      id2,
      'transaction',
      data2.transaction.hash.toHexString()
    );
    assert.fieldEquals(
      'StakeAllocatedEvent',
      id2,
      'staker',
      data2.params.staker.toHexString()
    );
    assert.fieldEquals('StakeAllocatedEvent', id2, 'amount', '50');
    assert.fieldEquals(
      'StakeAllocatedEvent',
      id2,
      'escrow',
      data2.params.escrowAddress.toHexString()
    );

    // Leader statistics
    assert.fieldEquals(
      'LeaderStatistics',
      STATISTICS_ENTITY_ID,
      'leaders',
      '2'
    );

    // Leader
    assert.fieldEquals(
      'Leader',
      data1.params.staker.toHexString(),
      'amountStaked',
      '70'
    );
    assert.fieldEquals(
      'Leader',
      data1.params.staker.toHexString(),
      'amountLocked',
      '20'
    );
    assert.fieldEquals(
      'Leader',
      data1.params.staker.toHexString(),
      'lockedUntilTimestamp',
      '30'
    );
    assert.fieldEquals(
      'Leader',
      data1.params.staker.toHexString(),
      'amountWithdrawn',
      '30'
    );
    assert.fieldEquals(
      'Leader',
      data1.params.staker.toHexString(),
      'amountAllocated',
      '30'
    );

    assert.fieldEquals(
      'Leader',
      data2.params.staker.toHexString(),
      'amountStaked',
      '100'
    );
    assert.fieldEquals(
      'Leader',
      data2.params.staker.toHexString(),
      'amountLocked',
      '0'
    );
    assert.fieldEquals(
      'Leader',
      data2.params.staker.toHexString(),
      'lockedUntilTimestamp',
      '0'
    );
    assert.fieldEquals(
      'Leader',
      data2.params.staker.toHexString(),
      'amountWithdrawn',
      '100'
    );
    assert.fieldEquals(
      'Leader',
      data2.params.staker.toHexString(),
      'amountAllocated',
      '50'
    );
  });

  test('Should properly index StakeSlashed events', () => {
    const data1 = createStakeSlashedEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      10,
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC7',
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC8',
      BigInt.fromI32(60)
    );
    const data2 = createStakeSlashedEvent(
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      10,
      '0x92a2eEF7Ff696BCef98957a0189872680600a95A',
      '0x92a2eEF7Ff696BCef98957a0189872680600a95B',
      BigInt.fromI32(61)
    );

    handleStakeSlashed(data1);
    handleStakeSlashed(data2);

    const id1 = `${data1.transaction.hash.toHex()}-${data1.logIndex.toString()}-${
      data1.block.timestamp
    }`;
    const id2 = `${data2.transaction.hash.toHex()}-${data2.logIndex.toString()}-${
      data2.block.timestamp
    }`;

    // Data 1
    assert.fieldEquals(
      'StakeSlashedEvent',
      id1,
      'timestamp',
      data1.block.timestamp.toString()
    );
    assert.fieldEquals(
      'StakeSlashedEvent',
      id1,
      'block',
      data1.block.number.toString()
    );
    assert.fieldEquals(
      'StakeSlashedEvent',
      id1,
      'transaction',
      data1.transaction.hash.toHexString()
    );
    assert.fieldEquals(
      'StakeSlashedEvent',
      id1,
      'staker',
      data1.params.staker.toHexString()
    );
    assert.fieldEquals('StakeSlashedEvent', id1, 'amount', '10');
    assert.fieldEquals(
      'StakeSlashedEvent',
      id1,
      'escrow',
      data1.params.escrowAddress.toHexString()
    );
    assert.fieldEquals(
      'StakeSlashedEvent',
      id1,
      'slasher',
      data1.params.slasher.toHexString()
    );

    // Data 2
    assert.fieldEquals(
      'StakeSlashedEvent',
      id2,
      'timestamp',
      data2.block.timestamp.toString()
    );
    assert.fieldEquals(
      'StakeSlashedEvent',
      id2,
      'block',
      data2.block.number.toString()
    );
    assert.fieldEquals(
      'StakeSlashedEvent',
      id2,
      'transaction',
      data2.transaction.hash.toHexString()
    );
    assert.fieldEquals(
      'StakeSlashedEvent',
      id2,
      'staker',
      data2.params.staker.toHexString()
    );
    assert.fieldEquals('StakeSlashedEvent', id2, 'amount', '10');
    assert.fieldEquals(
      'StakeSlashedEvent',
      id2,
      'escrow',
      data2.params.escrowAddress.toHexString()
    );
    assert.fieldEquals(
      'StakeSlashedEvent',
      id2,
      'slasher',
      data2.params.slasher.toHexString()
    );

    // Leader statistics
    assert.fieldEquals(
      'LeaderStatistics',
      STATISTICS_ENTITY_ID,
      'leaders',
      '2'
    );

    // Leader
    assert.fieldEquals(
      'Leader',
      data1.params.staker.toHexString(),
      'amountStaked',
      '60'
    );
    assert.fieldEquals(
      'Leader',
      data1.params.staker.toHexString(),
      'amountLocked',
      '20'
    );
    assert.fieldEquals(
      'Leader',
      data1.params.staker.toHexString(),
      'lockedUntilTimestamp',
      '30'
    );
    assert.fieldEquals(
      'Leader',
      data1.params.staker.toHexString(),
      'amountWithdrawn',
      '30'
    );
    assert.fieldEquals(
      'Leader',
      data1.params.staker.toHexString(),
      'amountAllocated',
      '20'
    );
    assert.fieldEquals(
      'Leader',
      data1.params.staker.toHexString(),
      'amountSlashed',
      '10'
    );

    assert.fieldEquals(
      'Leader',
      data2.params.staker.toHexString(),
      'amountStaked',
      '90'
    );
    assert.fieldEquals(
      'Leader',
      data2.params.staker.toHexString(),
      'amountLocked',
      '0'
    );
    assert.fieldEquals(
      'Leader',
      data2.params.staker.toHexString(),
      'lockedUntilTimestamp',
      '0'
    );
    assert.fieldEquals(
      'Leader',
      data2.params.staker.toHexString(),
      'amountWithdrawn',
      '100'
    );
    assert.fieldEquals(
      'Leader',
      data2.params.staker.toHexString(),
      'amountAllocated',
      '40'
    );
    assert.fieldEquals(
      'Leader',
      data2.params.staker.toHexString(),
      'amountSlashed',
      '10'
    );
  });

  test('Should properly index AllocationClosed events', () => {
    const data1 = createAllocationClosedEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      20,
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC7',
      70,
      BigInt.fromI32(70)
    );
    const data2 = createAllocationClosedEvent(
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      40,
      '0x92a2eEF7Ff696BCef98957a0189872680600a95A',
      71,
      BigInt.fromI32(71)
    );

    handleAllocationClosed(data1);
    handleAllocationClosed(data2);

    const id1 = `${data1.transaction.hash.toHex()}-${data1.logIndex.toString()}-${
      data1.block.timestamp
    }`;
    const id2 = `${data2.transaction.hash.toHex()}-${data2.logIndex.toString()}-${
      data2.block.timestamp
    }`;

    // Data 1
    assert.fieldEquals(
      'AllocationClosedEvent',
      id1,
      'timestamp',
      data1.block.timestamp.toString()
    );
    assert.fieldEquals(
      'AllocationClosedEvent',
      id1,
      'block',
      data1.block.number.toString()
    );
    assert.fieldEquals(
      'AllocationClosedEvent',
      id1,
      'transaction',
      data1.transaction.hash.toHexString()
    );
    assert.fieldEquals(
      'AllocationClosedEvent',
      id1,
      'staker',
      data1.params.staker.toHexString()
    );
    assert.fieldEquals('AllocationClosedEvent', id1, 'amount', '20');
    assert.fieldEquals(
      'AllocationClosedEvent',
      id1,
      'escrow',
      data1.params.escrowAddress.toHexString()
    );

    // Data 2
    assert.fieldEquals(
      'AllocationClosedEvent',
      id2,
      'timestamp',
      data2.block.timestamp.toString()
    );
    assert.fieldEquals(
      'AllocationClosedEvent',
      id2,
      'block',
      data2.block.number.toString()
    );
    assert.fieldEquals(
      'AllocationClosedEvent',
      id2,
      'transaction',
      data2.transaction.hash.toHexString()
    );
    assert.fieldEquals(
      'AllocationClosedEvent',
      id2,
      'staker',
      data2.params.staker.toHexString()
    );
    assert.fieldEquals('AllocationClosedEvent', id2, 'amount', '40');
    assert.fieldEquals(
      'AllocationClosedEvent',
      id2,
      'escrow',
      data2.params.escrowAddress.toHexString()
    );

    // Leader statistics
    assert.fieldEquals(
      'LeaderStatistics',
      STATISTICS_ENTITY_ID,
      'leaders',
      '2'
    );

    // Leader
    assert.fieldEquals(
      'Leader',
      data1.params.staker.toHexString(),
      'amountStaked',
      '60'
    );
    assert.fieldEquals(
      'Leader',
      data1.params.staker.toHexString(),
      'amountLocked',
      '20'
    );
    assert.fieldEquals(
      'Leader',
      data1.params.staker.toHexString(),
      'lockedUntilTimestamp',
      '30'
    );
    assert.fieldEquals(
      'Leader',
      data1.params.staker.toHexString(),
      'amountWithdrawn',
      '30'
    );
    assert.fieldEquals(
      'Leader',
      data1.params.staker.toHexString(),
      'amountAllocated',
      '0'
    );

    assert.fieldEquals(
      'Leader',
      data1.params.staker.toHexString(),
      'amountSlashed',
      '10'
    );

    assert.fieldEquals(
      'Leader',
      data2.params.staker.toHexString(),
      'amountStaked',
      '90'
    );
    assert.fieldEquals(
      'Leader',
      data2.params.staker.toHexString(),
      'amountLocked',
      '0'
    );
    assert.fieldEquals(
      'Leader',
      data2.params.staker.toHexString(),
      'lockedUntilTimestamp',
      '0'
    );
    assert.fieldEquals(
      'Leader',
      data2.params.staker.toHexString(),
      'amountWithdrawn',
      '100'
    );
    assert.fieldEquals(
      'Leader',
      data2.params.staker.toHexString(),
      'amountAllocated',
      '0'
    );
    assert.fieldEquals(
      'Leader',
      data2.params.staker.toHexString(),
      'amountSlashed',
      '10'
    );

    clearStore();
  });
});
