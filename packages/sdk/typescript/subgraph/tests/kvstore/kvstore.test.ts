import { BigInt, DataSourceContext } from '@graphprotocol/graph-ts';
import {
  afterEach,
  assert,
  beforeAll,
  clearStore,
  dataSourceMock,
  describe,
  test,
} from 'matchstick-as/assembly';

import { Operator } from '../../generated/schema';
import { handleDataSaved } from '../../src/mapping/KVStore';
import { toEventId } from '../../src/mapping/utils/event';
import { toBytes } from '../../src/mapping/utils/string';
import { createDataSavedEvent } from './fixtures';

const kvStoreAddressString = '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65';

describe('KVStore', () => {
  beforeAll(() => {
    dataSourceMock.setReturnValues(
      kvStoreAddressString,
      'rinkeby',
      new DataSourceContext()
    );
  });
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
      'Job Launcher',
      BigInt.fromI32(11)
    );

    handleDataSaved(data1);
    handleDataSaved(data2);

    const id1 = toEventId(data1).toHex();
    const id2 = toEventId(data2).toHex();

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
      'operatorAddress',
      data1.params.sender.toHex()
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
      'operatorAddress',
      data2.params.sender.toHex()
    );
    assert.fieldEquals('KVStoreSetEvent', id2, 'key', 'role');
    assert.fieldEquals('KVStoreSetEvent', id2, 'value', 'Job Launcher');
  });

  test('Should properly create a transaction with set method', () => {
    const data1 = createDataSavedEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      'role',
      'Operator',
      BigInt.fromI32(10)
    );
    const data2 = createDataSavedEvent(
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      'role',
      'Job Launcher',
      BigInt.fromI32(11)
    );

    handleDataSaved(data1);
    handleDataSaved(data2);

    assert.fieldEquals(
      'Transaction',
      data1.transaction.hash.toHex(),
      'txHash',
      data1.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'Transaction',
      data2.transaction.hash.toHex(),
      'txHash',
      data2.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'Transaction',
      data1.transaction.hash.toHex(),
      'method',
      'set'
    );
    assert.fieldEquals(
      'Transaction',
      data2.transaction.hash.toHex(),
      'method',
      'set'
    );
    assert.fieldEquals(
      'Transaction',
      data1.transaction.hash.toHex(),
      'block',
      data1.block.number.toString()
    );
    assert.fieldEquals(
      'Transaction',
      data2.transaction.hash.toHex(),
      'block',
      data2.block.number.toString()
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
      'from',
      data2.transaction.from.toHex()
    );
    assert.fieldEquals(
      'Transaction',
      data1.transaction.hash.toHex(),
      'to',
      kvStoreAddressString
    );
    assert.fieldEquals(
      'Transaction',
      data2.transaction.hash.toHex(),
      'to',
      kvStoreAddressString
    );
  });

  test('Should properly create a transaction with setBulk method', () => {
    const data1 = createDataSavedEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      'role',
      'Operator',
      BigInt.fromI32(10)
    );
    const data2 = createDataSavedEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      'webhook_url',
      'https://operator.example.com',
      BigInt.fromI32(10)
    );

    handleDataSaved(data1);
    handleDataSaved(data2);

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
      'setBulk'
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
      data1.transaction.hash.toHex(),
      'to',
      kvStoreAddressString
    );

    const internalTransactionId = toEventId(data1).toHex();
    assert.fieldEquals(
      'InternalTransaction',
      internalTransactionId,
      'transaction',
      data1.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'InternalTransaction',
      internalTransactionId,
      'from',
      data1.transaction.from.toHex()
    );
    assert.fieldEquals(
      'InternalTransaction',
      internalTransactionId,
      'to',
      kvStoreAddressString
    );
    assert.fieldEquals(
      'InternalTransaction',
      internalTransactionId,
      'value',
      '0'
    );
    assert.fieldEquals(
      'InternalTransaction',
      internalTransactionId,
      'method',
      'set'
    );
  });
  test('Should properly remove KVStore entity when value is empty', () => {
    const data1 = createDataSavedEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      'role',
      'Operator',
      BigInt.fromI32(10)
    );
    const data2 = createDataSavedEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      'role',
      '',
      BigInt.fromI32(11)
    );

    handleDataSaved(data1);

    assert.fieldEquals(
      'KVStore',
      data1.params.sender.concat(toBytes(data1.params.key)).toHex(),
      'value',
      'Operator'
    );

    handleDataSaved(data2);

    assert.notInStore(
      'KVStore',
      data2.params.sender.concat(toBytes(data2.params.key)).toHex()
    );
  });

  test("Should properly set operator's attribute to null when value is empty and remove KVStore entity", () => {
    const data1 = createDataSavedEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      'role',
      'Operator',
      BigInt.fromI32(10)
    );
    const data2 = createDataSavedEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      'role',
      '',
      BigInt.fromI32(11)
    );

    handleDataSaved(data1);

    assert.fieldEquals(
      'Operator',
      data1.params.sender.toHex(),
      'role',
      'Operator'
    );
    assert.fieldEquals(
      'KVStore',
      data1.params.sender.concat(toBytes(data1.params.key)).toHex(),
      'key',
      'role'
    );

    handleDataSaved(data2);

    const operator = Operator.load(data2.params.sender);
    assert.assertNotNull(operator);
    if (operator != null) {
      assert.assertNull(operator.role);
    }
    assert.notInStore(
      'KVStore',
      data1.params.sender.concat(toBytes(data1.params.key)).toHex()
    );
  });

  test('Should properly update operator role', () => {
    const data1 = createDataSavedEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      'role',
      'Operator',
      BigInt.fromI32(10)
    );
    const data2 = createDataSavedEvent(
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      'role',
      'Job Launcher',
      BigInt.fromI32(11)
    );

    handleDataSaved(data1);
    handleDataSaved(data2);

    assert.fieldEquals(
      'Operator',
      data1.params.sender.toHex(),
      'role',
      'Operator'
    );
    assert.fieldEquals(
      'Operator',
      data2.params.sender.toHex(),
      'role',
      'Job Launcher'
    );
  });

  test("Should properly update operator's fee", () => {
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

    assert.fieldEquals('Operator', data1.params.sender.toHex(), 'fee', '10');
    assert.fieldEquals('Operator', data2.params.sender.toHex(), 'fee', '11');
  });

  test("Should properly update operator's public key", () => {
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
      'Operator',
      data1.params.sender.toHex(),
      'publicKey',
      `-----BEGIN PUBLIC KEY-----
      MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCRxdc9o3XUliS8peqMEwIt8+nE
      Bdovfc8bTNSUt1MH/afCSzrIxvn/cb/KmFmN6agusbRKA4PhuTXpPQb+EN8m/uTo
      hbjrWc8Z+Dbj0mU8e9u0y71DIgTYfMbnaEctHs5P3hSxBPSLZ6ecVPHl1ZE4mvSR
      qK8jvQmOGbiQrO6PmQIDAQAB
      -----END PUBLIC KEY-----`
    );
    assert.fieldEquals(
      'Operator',
      data2.params.sender.toHex(),
      'publicKey',
      `-----BEGIN PUBLIC KEY-----
      MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCzcUeZlurLuQuDzc4ZhJMiDete
      +jJRmQKwRaoVEP3vkOhBJ+U3pYAnlFGcpu7U/tHBgabc3hXxqnjZ/ux0kDyar8sK
      7XxKo6HwbpMJjwTt7lTBbM7eOXXnFzLINRODZXxovEi4RynrEdkfrwkqD2ZOuypW
      hR+eZjsHgU9TttGCIQIDAQAB
      -----END PUBLIC KEY-----`
    );
  });

  test("Should properly update operator's webhook url", () => {
    const data1 = createDataSavedEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      'webhook_url',
      'https://operator.example.com',
      BigInt.fromI32(10)
    );
    const data2 = createDataSavedEvent(
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      'webhook_url',
      'https://job-launcher.example.com',
      BigInt.fromI32(11)
    );

    handleDataSaved(data1);
    handleDataSaved(data2);

    assert.fieldEquals(
      'Operator',
      data1.params.sender.toHex(),
      'webhookUrl',
      'https://operator.example.com'
    );
    assert.fieldEquals(
      'OperatorURL',
      data1.params.sender.concat(toBytes('webhook_url')).toHex(),
      'key',
      'webhook_url'
    );
    assert.fieldEquals(
      'OperatorURL',
      data1.params.sender.concat(toBytes('webhook_url')).toHex(),
      'url',
      'https://operator.example.com'
    );

    assert.fieldEquals(
      'Operator',
      data2.params.sender.toHex(),
      'webhookUrl',
      'https://job-launcher.example.com'
    );
    assert.fieldEquals(
      'OperatorURL',
      data2.params.sender.concat(toBytes('webhook_url')).toHex(),
      'key',
      'webhook_url'
    );
    assert.fieldEquals(
      'OperatorURL',
      data2.params.sender.concat(toBytes('webhook_url')).toHex(),
      'url',
      'https://job-launcher.example.com'
    );
  });

  test("Should properly update operator's website", () => {
    const data1 = createDataSavedEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      'website',
      'https://operator.example.com',
      BigInt.fromI32(10)
    );
    const data2 = createDataSavedEvent(
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      'website',
      'https://job-launcher.example.com',
      BigInt.fromI32(11)
    );

    handleDataSaved(data1);
    handleDataSaved(data2);

    assert.fieldEquals(
      'Operator',
      data1.params.sender.toHex(),
      'website',
      'https://operator.example.com'
    );

    assert.fieldEquals(
      'Operator',
      data2.params.sender.toHex(),
      'website',
      'https://job-launcher.example.com'
    );
  });

  test("Should properly update operator's url", () => {
    const data1 = createDataSavedEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      'url',
      'https://operator.example.com',
      BigInt.fromI32(10)
    );
    const data2 = createDataSavedEvent(
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      'URL',
      'https://job-launcher.example.com',
      BigInt.fromI32(11)
    );

    handleDataSaved(data1);
    handleDataSaved(data2);

    assert.fieldEquals(
      'Operator',
      data1.params.sender.toHex(),
      'url',
      'https://operator.example.com'
    );
    assert.fieldEquals(
      'OperatorURL',
      data1.params.sender.concat(toBytes('url')).toHex(),
      'key',
      'url'
    );
    assert.fieldEquals(
      'OperatorURL',
      data1.params.sender.concat(toBytes('url')).toHex(),
      'url',
      'https://operator.example.com'
    );

    assert.fieldEquals(
      'Operator',
      data2.params.sender.toHex(),
      'url',
      'https://job-launcher.example.com'
    );
    assert.fieldEquals(
      'OperatorURL',
      data2.params.sender.concat(toBytes('url')).toHex(),
      'key',
      'url'
    );
    assert.fieldEquals(
      'OperatorURL',
      data2.params.sender.concat(toBytes('url')).toHex(),
      'url',
      'https://job-launcher.example.com'
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
      'Operator',
      data1.params.sender.toHex(),
      'role',
      'Reputation Oracle'
    );
    assert.fieldEquals(
      'Operator',
      data2.params.sender.toHex(),
      'role',
      'Job Launcher'
    );

    assert.fieldEquals(
      'Operator',
      data2.params.sender.toHex(),
      'reputationNetworks',
      `[${data1.params.sender.toHex()}]`
    );
  });

  test('Should properly update KVStore entity', () => {
    const data1 = createDataSavedEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      'role',
      'Reputation Oracle',
      BigInt.fromI32(10)
    );
    const data2 = createDataSavedEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      'role',
      'Job Launcher',
      BigInt.fromI32(11)
    );
    handleDataSaved(data1);

    assert.fieldEquals(
      'KVStore',
      data1.params.sender.concat(toBytes(data1.params.key)).toHex(),
      'key',
      'role'
    );
    assert.fieldEquals(
      'KVStore',
      data1.params.sender.concat(toBytes(data1.params.key)).toHex(),
      'value',
      'Reputation Oracle'
    );

    handleDataSaved(data2);

    assert.fieldEquals(
      'KVStore',
      data1.params.sender.concat(toBytes(data1.params.key)).toHex(),
      'key',
      'role'
    );
    assert.fieldEquals(
      'KVStore',
      data1.params.sender.concat(toBytes(data1.params.key)).toHex(),
      'value',
      'Job Launcher'
    );
  });

  test("Should properly update operator's registration needed", () => {
    const data1 = createDataSavedEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      'registration_needed',
      'true',
      BigInt.fromI32(10)
    );
    const data2 = createDataSavedEvent(
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      'registration_needed',
      'false',
      BigInt.fromI32(11)
    );

    handleDataSaved(data1);
    handleDataSaved(data2);

    assert.fieldEquals(
      'Operator',
      data1.params.sender.toHex(),
      'registrationNeeded',
      'true'
    );

    assert.fieldEquals(
      'Operator',
      data2.params.sender.toHex(),
      'registrationNeeded',
      'false'
    );
  });

  test("Should properly update operator's registration instructions", () => {
    const data1 = createDataSavedEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      'registration_instructions',
      'https://job-launcher.example.com',
      BigInt.fromI32(10)
    );
    const data2 = createDataSavedEvent(
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      'registration_instructions',
      'https://job-launcher.example.com',
      BigInt.fromI32(11)
    );

    handleDataSaved(data1);
    handleDataSaved(data2);

    assert.fieldEquals(
      'Operator',
      data1.params.sender.toHex(),
      'registrationInstructions',
      'https://job-launcher.example.com'
    );

    assert.fieldEquals(
      'Operator',
      data2.params.sender.toHex(),
      'registrationInstructions',
      'https://job-launcher.example.com'
    );
  });

  test("Should properly update operator's name", () => {
    const data1 = createDataSavedEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      'name',
      'Alice',
      BigInt.fromI32(10)
    );
    const data2 = createDataSavedEvent(
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      'name',
      'Bob',
      BigInt.fromI32(11)
    );

    handleDataSaved(data1);
    handleDataSaved(data2);

    assert.fieldEquals(
      'Operator',
      data1.params.sender.toHex(),
      'name',
      'Alice'
    );
    assert.fieldEquals('Operator', data2.params.sender.toHex(), 'name', 'Bob');
  });

  test("Should properly update operator's category", () => {
    const data1 = createDataSavedEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      'category',
      'machine_learning',
      BigInt.fromI32(10)
    );
    const data2 = createDataSavedEvent(
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      'category',
      'market_making',
      BigInt.fromI32(11)
    );

    handleDataSaved(data1);
    handleDataSaved(data2);

    assert.fieldEquals(
      'Operator',
      data1.params.sender.toHex(),
      'category',
      'machine_learning'
    );
    assert.fieldEquals(
      'Operator',
      data2.params.sender.toHex(),
      'category',
      'market_making'
    );
  });
});
