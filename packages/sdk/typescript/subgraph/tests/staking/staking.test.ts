import { BigInt } from '@graphprotocol/graph-ts';
import { describe, test, assert, clearStore } from 'matchstick-as/assembly';

import {
  handleStakeDeposited,
  STATISTICS_ENTITY_ID,
} from '../../src/mapping/Staking';
import { createStakeDepositedEvent } from './fixtures';

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
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6'
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
      data1.transaction.hash.toHexString()
    );
    assert.fieldEquals(
      'StakeDepositedEvent',
      id2,
      'leader',
      '0x92a2eEF7Ff696BCef98957a0189872680600a959'
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

    clearStore();
  });
});
