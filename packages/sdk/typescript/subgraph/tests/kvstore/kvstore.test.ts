import { BigInt } from '@graphprotocol/graph-ts';
import {
  describe,
  test,
  assert,
  clearStore,
  afterEach,
} from 'matchstick-as/assembly';

import { handleDataSaved } from '../../src/mapping/KVStore';
import { createDataSavedEvent } from './fixtures';

describe('KVStore', () => {
  afterEach(() => {
    clearStore();
  });

  test('Should properly index DataSaved events', () => {
    const data1 = createDataSavedEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      'role',
      'Operator',
      BigInt.fromI32(10)
    );
    const data2 = createDataSavedEvent(
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      'role',
      'Validator',
      BigInt.fromI32(11)
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
      'KVStoreSetEvent',
      id1,
      'block',
      data1.block.number.toString()
    );
    assert.fieldEquals(
      'KVStoreSetEvent',
      id1,
      'timestamp',
      data1.block.timestamp.toString()
    );
    assert.fieldEquals(
      'KVStoreSetEvent',
      id1,
      'txHash',
      data1.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'KVStoreSetEvent',
      id1,
      'leaderAddress',
      data1.params.sender.toHexString()
    );
    assert.fieldEquals('KVStoreSetEvent', id1, 'key', 'role');
    assert.fieldEquals('KVStoreSetEvent', id1, 'value', 'Operator');

    // Data 2
    assert.fieldEquals(
      'KVStoreSetEvent',
      id2,
      'block',
      data2.block.number.toString()
    );
    assert.fieldEquals(
      'KVStoreSetEvent',
      id2,
      'timestamp',
      data2.block.timestamp.toString()
    );
    assert.fieldEquals(
      'KVStoreSetEvent',
      id2,
      'txHash',
      data2.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'KVStoreSetEvent',
      id2,
      'leaderAddress',
      data2.params.sender.toHexString()
    );
    assert.fieldEquals('KVStoreSetEvent', id2, 'key', 'role');
    assert.fieldEquals('KVStoreSetEvent', id2, 'value', 'Validator');
  });

  test('Should properly update leader role', () => {
    const data1 = createDataSavedEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      'role',
      'Operator',
      BigInt.fromI32(10)
    );
    const data2 = createDataSavedEvent(
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      'role',
      'Validator',
      BigInt.fromI32(11)
    );

    handleDataSaved(data1);
    handleDataSaved(data2);

    assert.fieldEquals(
      'Leader',
      data1.params.sender.toHexString(),
      'role',
      'Operator'
    );
    assert.fieldEquals(
      'Leader',
      data2.params.sender.toHexString(),
      'role',
      'Validator'
    );
  });

  test("Should properly update leader's fee", () => {
    const data1 = createDataSavedEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      'fee',
      '10',
      BigInt.fromI32(10)
    );
    const data2 = createDataSavedEvent(
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      'fee',
      '11',
      BigInt.fromI32(11)
    );

    handleDataSaved(data1);
    handleDataSaved(data2);

    assert.fieldEquals(
      'Leader',
      data1.params.sender.toHexString(),
      'fee',
      '10'
    );
    assert.fieldEquals(
      'Leader',
      data2.params.sender.toHexString(),
      'fee',
      '11'
    );
  });

  test("Should properly update leader's public key", () => {
    const data1 = createDataSavedEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      'public_key',
      `-----BEGIN PUBLIC KEY-----
      MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCRxdc9o3XUliS8peqMEwIt8+nE
      Bdovfc8bTNSUt1MH/afCSzrIxvn/cb/KmFmN6agusbRKA4PhuTXpPQb+EN8m/uTo
      hbjrWc8Z+Dbj0mU8e9u0y71DIgTYfMbnaEctHs5P3hSxBPSLZ6ecVPHl1ZE4mvSR
      qK8jvQmOGbiQrO6PmQIDAQAB
      -----END PUBLIC KEY-----`,
      BigInt.fromI32(10)
    );
    const data2 = createDataSavedEvent(
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      'public_key',
      `-----BEGIN PUBLIC KEY-----
      MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCzcUeZlurLuQuDzc4ZhJMiDete
      +jJRmQKwRaoVEP3vkOhBJ+U3pYAnlFGcpu7U/tHBgabc3hXxqnjZ/ux0kDyar8sK
      7XxKo6HwbpMJjwTt7lTBbM7eOXXnFzLINRODZXxovEi4RynrEdkfrwkqD2ZOuypW
      hR+eZjsHgU9TttGCIQIDAQAB
      -----END PUBLIC KEY-----`,
      BigInt.fromI32(11)
    );

    handleDataSaved(data1);
    handleDataSaved(data2);

    assert.fieldEquals(
      'Leader',
      data1.params.sender.toHexString(),
      'publicKey',
      `-----BEGIN PUBLIC KEY-----
      MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCRxdc9o3XUliS8peqMEwIt8+nE
      Bdovfc8bTNSUt1MH/afCSzrIxvn/cb/KmFmN6agusbRKA4PhuTXpPQb+EN8m/uTo
      hbjrWc8Z+Dbj0mU8e9u0y71DIgTYfMbnaEctHs5P3hSxBPSLZ6ecVPHl1ZE4mvSR
      qK8jvQmOGbiQrO6PmQIDAQAB
      -----END PUBLIC KEY-----`
    );
    assert.fieldEquals(
      'Leader',
      data2.params.sender.toHexString(),
      'publicKey',
      `-----BEGIN PUBLIC KEY-----
      MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCzcUeZlurLuQuDzc4ZhJMiDete
      +jJRmQKwRaoVEP3vkOhBJ+U3pYAnlFGcpu7U/tHBgabc3hXxqnjZ/ux0kDyar8sK
      7XxKo6HwbpMJjwTt7lTBbM7eOXXnFzLINRODZXxovEi4RynrEdkfrwkqD2ZOuypW
      hR+eZjsHgU9TttGCIQIDAQAB
      -----END PUBLIC KEY-----`
    );
  });

  test("Should properly update leader's webhook url", () => {
    const data1 = createDataSavedEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      'webhook_url',
      'https://operator.example.com',
      BigInt.fromI32(10)
    );
    const data2 = createDataSavedEvent(
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      'webhook_url',
      'https://validator.example.com',
      BigInt.fromI32(11)
    );

    handleDataSaved(data1);
    handleDataSaved(data2);

    assert.fieldEquals(
      'Leader',
      data1.params.sender.toHexString(),
      'webhookUrl',
      'https://operator.example.com'
    );
    assert.fieldEquals(
      'LeaderURL',
      `${data1.params.sender.toHexString()}-webhook_url`,
      'key',
      'webhook_url'
    );
    assert.fieldEquals(
      'LeaderURL',
      `${data1.params.sender.toHexString()}-webhook_url`,
      'url',
      'https://operator.example.com'
    );

    assert.fieldEquals(
      'Leader',
      data2.params.sender.toHexString(),
      'webhookUrl',
      'https://validator.example.com'
    );
    assert.fieldEquals(
      'LeaderURL',
      `${data2.params.sender.toHexString()}-webhook_url`,
      'key',
      'webhook_url'
    );
    assert.fieldEquals(
      'LeaderURL',
      `${data2.params.sender.toHexString()}-webhook_url`,
      'url',
      'https://validator.example.com'
    );
  });

  test("Should properly update leader's url", () => {
    const data1 = createDataSavedEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      'url',
      'https://operator.example.com',
      BigInt.fromI32(10)
    );
    const data2 = createDataSavedEvent(
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      'URL',
      'https://validator.example.com',
      BigInt.fromI32(11)
    );

    handleDataSaved(data1);
    handleDataSaved(data2);

    assert.fieldEquals(
      'Leader',
      data1.params.sender.toHexString(),
      'url',
      'https://operator.example.com'
    );
    assert.fieldEquals(
      'LeaderURL',
      `${data1.params.sender.toHexString()}-url`,
      'key',
      'url'
    );
    assert.fieldEquals(
      'LeaderURL',
      `${data1.params.sender.toHexString()}-url`,
      'url',
      'https://operator.example.com'
    );

    assert.fieldEquals(
      'Leader',
      data2.params.sender.toHexString(),
      'url',
      'https://validator.example.com'
    );
    assert.fieldEquals(
      'LeaderURL',
      `${data2.params.sender.toHexString()}-url`,
      'key',
      'url'
    );
    assert.fieldEquals(
      'LeaderURL',
      `${data2.params.sender.toHexString()}-url`,
      'url',
      'https://validator.example.com'
    );
  });

  test('Should properly update reputation network', () => {
    const data1 = createDataSavedEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      'role',
      'Reputation Oracle',
      BigInt.fromI32(10)
    );
    const data2 = createDataSavedEvent(
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      'role',
      'Job Launcher',
      BigInt.fromI32(11)
    );
    const data3 = createDataSavedEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      'ACTIVE',
      BigInt.fromI32(12)
    );
    handleDataSaved(data1);
    handleDataSaved(data2);
    handleDataSaved(data3);

    assert.fieldEquals(
      'Leader',
      data1.params.sender.toHexString(),
      'role',
      'Reputation Oracle'
    );
    assert.fieldEquals(
      'Leader',
      data2.params.sender.toHexString(),
      'role',
      'Job Launcher'
    );
    assert.fieldEquals(
      'Leader',
      data2.params.sender.toHexString(),
      'reputationNetwork',
      data1.params.sender.toHexString()
    );
  });
});
