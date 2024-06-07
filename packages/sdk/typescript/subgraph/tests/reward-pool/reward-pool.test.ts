import { BigInt } from '@graphprotocol/graph-ts';
import {
  describe,
  test,
  assert,
  clearStore,
  afterAll,
} from 'matchstick-as/assembly';

import { handleRewardAdded } from '../../src/mapping/RewardPool';
import { createRewardAddedEvent } from './fixtures';

describe('RewardPool', () => {
  afterAll(() => {
    clearStore();
  });

  test('Should properly index RewardAddedEvent events', () => {
    const data1 = createRewardAddedEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC7',
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC5',
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      30,
      BigInt.fromI32(50)
    );
    const data2 = createRewardAddedEvent(
      '0x92a2eEF7Ff696BCef98957a0189872680600a95A',
      '0x92a2eEF7Ff696BCef98957a0189872680600a958',
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      50,
      BigInt.fromI32(51)
    );

    handleRewardAdded(data1);
    handleRewardAdded(data2);

    const id1 = `${data1.transaction.hash.toHex()}-${data1.logIndex.toString()}-${
      data1.block.timestamp
    }`;
    const id2 = `${data2.transaction.hash.toHex()}-${data2.logIndex.toString()}-${
      data2.block.timestamp
    }`;

    // Data 1
    assert.fieldEquals(
      'RewardAddedEvent',
      id1,
      'block',
      data1.block.number.toString()
    );
    assert.fieldEquals(
      'RewardAddedEvent',
      id1,
      'timestamp',
      data1.block.timestamp.toString()
    );
    assert.fieldEquals(
      'RewardAddedEvent',
      id1,
      'txHash',
      data1.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'RewardAddedEvent',
      id1,
      'escrowAddress',
      data1.params.escrowAddress.toHex()
    );
    assert.fieldEquals(
      'RewardAddedEvent',
      id1,
      'staker',
      data1.params.staker.toHex()
    );
    assert.fieldEquals(
      'RewardAddedEvent',
      id1,
      'slasher',
      data1.params.slasher.toHex()
    );
    assert.fieldEquals('RewardAddedEvent', id1, 'amount', '30');

    // Data 2
    assert.fieldEquals(
      'RewardAddedEvent',
      id2,
      'block',
      data2.block.number.toString()
    );
    assert.fieldEquals(
      'RewardAddedEvent',
      id2,
      'timestamp',
      data2.block.timestamp.toString()
    );
    assert.fieldEquals(
      'RewardAddedEvent',
      id2,
      'txHash',
      data2.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'RewardAddedEvent',
      id2,
      'escrowAddress',
      data2.params.escrowAddress.toHex()
    );
    assert.fieldEquals(
      'RewardAddedEvent',
      id2,
      'staker',
      data2.params.staker.toHex()
    );
    assert.fieldEquals(
      'RewardAddedEvent',
      id2,
      'slasher',
      data2.params.slasher.toHex()
    );
    assert.fieldEquals('RewardAddedEvent', id2, 'amount', '50');

    // Leader
    assert.fieldEquals('Leader', data1.params.slasher.toHex(), 'reward', '30');

    assert.fieldEquals('Leader', data2.params.slasher.toHex(), 'reward', '50');
    assert.fieldEquals(
      'Transaction',
      data1.transaction.hash.toHex(),
      'txHash',
      data1.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'Transaction',
      data1.transaction.hash.toHex(),
      'method',
      'addReward'
    );
    assert.fieldEquals(
      'Transaction',
      data1.transaction.hash.toHex(),
      'block',
      data1.block.number.toString()
    );
    assert.fieldEquals(
      'Transaction',
      data1.transaction.hash.toHex(),
      'from',
      data1.transaction.from.toHex()
    );
    assert.fieldEquals(
      'Transaction',
      data2.transaction.hash.toHex(),
      'txHash',
      data2.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'Transaction',
      data2.transaction.hash.toHex(),
      'method',
      'addReward'
    );
    assert.fieldEquals(
      'Transaction',
      data2.transaction.hash.toHex(),
      'block',
      data2.block.number.toString()
    );
    assert.fieldEquals(
      'Transaction',
      data2.transaction.hash.toHex(),
      'from',
      data2.transaction.from.toHex()
    );
  });
});
