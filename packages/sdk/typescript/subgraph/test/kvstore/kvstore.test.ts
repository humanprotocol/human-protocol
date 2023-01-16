import { describe, test, assert, clearStore } from 'matchstick-as/assembly';

import { handleDataSaved } from '../../src/mapping/KVStore';
import { createDataSavedEvent } from './fixtures';

describe('KVStore', () => {
  test('Should properly index DataSaved transfers', () => {
    const data1 = createDataSavedEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      'role',
      'Operator'
    );
    const data2 = createDataSavedEvent(
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      'role',
      'Validator'
    );

    handleDataSaved(data1);
    handleDataSaved(data2);

    const id1 = `${data1.transaction.hash.toHex()}-${data1.logIndex.toString()}-${
      data1.block.timestamp
    }`;
    const id2 = `${data2.transaction.hash.toHex()}-${data2.logIndex.toString()}-${
      data2.block.timestamp
    }`;

    // Data 1
    assert.fieldEquals(
      'DataSavedEvent',
      id1,
      'timestamp',
      data1.block.timestamp.toString()
    );
    assert.fieldEquals(
      'DataSavedEvent',
      id1,
      'block',
      data1.block.number.toString()
    );
    assert.fieldEquals(
      'DataSavedEvent',
      id1,
      'leader',
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6'
    );
    assert.fieldEquals('DataSavedEvent', id1, 'key', 'role');

    assert.fieldEquals('DataSavedEvent', id1, 'value', 'Operator');

    assert.fieldEquals(
      'DataSavedEvent',
      id1,
      'transaction',
      data1.transaction.hash.toHexString()
    );

    // Data 2
    assert.fieldEquals(
      'DataSavedEvent',
      id2,
      'timestamp',
      data2.block.timestamp.toString()
    );
    assert.fieldEquals(
      'DataSavedEvent',
      id2,
      'block',
      data2.block.number.toString()
    );
    assert.fieldEquals(
      'DataSavedEvent',
      id2,
      'leader',
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6'
    );
    assert.fieldEquals('DataSavedEvent', id2, 'key', 'role');

    assert.fieldEquals('DataSavedEvent', id2, 'value', 'Operator');

    assert.fieldEquals(
      'DataSavedEvent',
      id2,
      'transaction',
      data1.transaction.hash.toHexString()
    );

    clearStore();
  });

  test('Should properly update leader role', () => {
    const data1 = createDataSavedEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      'role',
      'Operator'
    );
    const data2 = createDataSavedEvent(
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      'role',
      'Validator'
    );

    handleDataSaved(data1);
    handleDataSaved(data2);

    assert.fieldEquals(
      'Leader',
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      'role',
      'Operator'
    );
    assert.fieldEquals(
      'Leader',
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      'role',
      'Validator1'
    );
  });
});
