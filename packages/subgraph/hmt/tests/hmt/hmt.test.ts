import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';
import {
  afterAll,
  assert,
  beforeEach,
  clearStore,
  describe,
  test,
} from 'matchstick-as/assembly';

import {
  HMT_STATISTICS_ENTITY_ID,
  handleApproval,
  handleBulkApproval,
  handleBulkTransfer,
  handleTransfer,
} from '../../src/mapping/HMToken';
import { ONE_DAY } from '../../src/mapping/utils/number';
import {
  createApprovalEvent,
  createBulkApprovalEvent,
  createBulkTransferEvent,
  createTransferEvent,
} from './fixtures';

const zeroAddressString = '0x0000000000000000000000000000000000000000';
const operatorAddressString = '0xD979105297fB0eee83F7433fC09279cb5B94fFC6';
const holderAddressString = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8';
const holderAddress = Address.fromString(holderAddressString);
const holder1AddressString = '0x92a2eEF7Ff696BCef98957a0189872680600a959';
const holder1Address = Address.fromString(holder1AddressString);

describe('HMToken', () => {
  beforeEach(() => {
    clearStore();
  });

  afterAll(() => {
    clearStore();
  });

  describe('Statistics', () => {
    test('Should properly calculate Transfer event in statistics', () => {
      const transfer1 = createTransferEvent(
        operatorAddressString,
        holder1AddressString,
        1,
        BigInt.fromI32(10)
      );
      const transfer2 = createTransferEvent(
        operatorAddressString,
        holder1AddressString,
        2,
        BigInt.fromI32(10)
      );

      handleTransfer(transfer1);
      handleTransfer(transfer2);

      assert.fieldEquals(
        'HMTokenStatistics',
        HMT_STATISTICS_ENTITY_ID.toHex(),
        'totalTransferEventCount',
        '2'
      );
      assert.fieldEquals(
        'HMTokenStatistics',
        HMT_STATISTICS_ENTITY_ID.toHex(),
        'totalValueTransfered',
        '3'
      );
    });

    test('Should properly calculate holders in statistics', () => {
      const transfer1 = createTransferEvent(
        zeroAddressString,
        holderAddressString,
        10,
        BigInt.fromI32(10)
      );

      const transfer2 = createTransferEvent(
        holderAddressString,
        holder1AddressString,
        0,
        BigInt.fromI32(10)
      );

      handleTransfer(transfer1);
      handleTransfer(transfer2);

      assert.fieldEquals('Holder', holderAddress.toHex(), 'balance', '10');
      assert.fieldEquals('Holder', holder1Address.toHex(), 'balance', '0');

      assert.fieldEquals(
        'HMTokenStatistics',
        HMT_STATISTICS_ENTITY_ID.toHex(),
        'holders',
        '1'
      );

      const transfer3 = createTransferEvent(
        zeroAddressString,
        holder1AddressString,
        10,
        BigInt.fromI32(10)
      );

      handleTransfer(transfer3);

      assert.fieldEquals('Holder', holderAddress.toHex(), 'balance', '10');
      assert.fieldEquals('Holder', holder1Address.toHex(), 'balance', '10');
      assert.fieldEquals(
        'HMTokenStatistics',
        HMT_STATISTICS_ENTITY_ID.toHex(),
        'holders',
        '2'
      );

      const transfer4 = createTransferEvent(
        holderAddressString,
        holder1AddressString,
        10,
        BigInt.fromI32(10)
      );

      handleTransfer(transfer4);

      assert.fieldEquals('Holder', holderAddress.toHex(), 'balance', '0');
      assert.fieldEquals('Holder', holder1Address.toHex(), 'balance', '20');
      assert.fieldEquals(
        'HMTokenStatistics',
        HMT_STATISTICS_ENTITY_ID.toHex(),
        'holders',
        '1'
      );
    });

    test('Should properly calculate Transfer daily metrics in statistics', () => {
      const transfer1 = createTransferEvent(
        operatorAddressString,
        holderAddressString,
        1,
        BigInt.fromI32(100)
      );
      const transfer2 = createTransferEvent(
        operatorAddressString,
        holder1AddressString,
        2,
        BigInt.fromI32(100)
      );
      const transfer3 = createTransferEvent(
        holder1AddressString,
        holderAddressString,
        3,
        BigInt.fromI32(100)
      );

      handleTransfer(transfer1);
      handleTransfer(transfer2);
      handleTransfer(transfer3);

      const dayZeroId = Bytes.fromI32(0).toHex();
      assert.fieldEquals('EventDayData', dayZeroId, 'timestamp', '0');
      assert.fieldEquals(
        'EventDayData',
        dayZeroId,
        'dailyHMTTransferCount',
        '3'
      );
      assert.fieldEquals(
        'EventDayData',
        dayZeroId,
        'dailyHMTTransferAmount',
        '6'
      );
      assert.fieldEquals('EventDayData', dayZeroId, 'dailyUniqueSenders', '2');
      assert.fieldEquals(
        'EventDayData',
        dayZeroId,
        'dailyUniqueReceivers',
        '2'
      );

      const operatorSenderId = Bytes.fromI32(0)
        .concat(Address.fromString(operatorAddressString))
        .toHex();
      const holder1SenderId = Bytes.fromI32(0).concat(holder1Address).toHex();
      const holderReceiverId = Bytes.fromI32(0).concat(holderAddress).toHex();
      const holder1ReceiverId = Bytes.fromI32(0).concat(holder1Address).toHex();

      assert.fieldEquals(
        'UniqueSender',
        operatorSenderId,
        'transferCount',
        '3'
      );
      assert.fieldEquals('UniqueSender', holder1SenderId, 'transferCount', '3');
      assert.fieldEquals(
        'UniqueReceiver',
        holderReceiverId,
        'receiveCount',
        '4'
      );
      assert.fieldEquals(
        'UniqueReceiver',
        holder1ReceiverId,
        'receiveCount',
        '2'
      );
    });

    test('Should properly create separate daily stats per day', () => {
      const day0Transfer = createTransferEvent(
        zeroAddressString,
        holderAddressString,
        5,
        BigInt.fromI32(100)
      );
      const day1Transfer = createTransferEvent(
        zeroAddressString,
        holderAddressString,
        7,
        BigInt.fromI32(ONE_DAY + 100)
      );

      handleTransfer(day0Transfer);
      handleTransfer(day1Transfer);

      assert.entityCount('EventDayData', 2);

      const day0Id = Bytes.fromI32(0).toHex();
      const day1Id = Bytes.fromI32(1).toHex();

      assert.fieldEquals('EventDayData', day0Id, 'dailyHMTTransferCount', '1');
      assert.fieldEquals('EventDayData', day0Id, 'dailyHMTTransferAmount', '5');
      assert.fieldEquals('EventDayData', day0Id, 'dailyUniqueSenders', '0');
      assert.fieldEquals('EventDayData', day0Id, 'dailyUniqueReceivers', '1');

      assert.fieldEquals('EventDayData', day1Id, 'dailyHMTTransferCount', '1');
      assert.fieldEquals('EventDayData', day1Id, 'dailyHMTTransferAmount', '7');
      assert.fieldEquals('EventDayData', day1Id, 'dailyUniqueSenders', '0');
      assert.fieldEquals('EventDayData', day1Id, 'dailyUniqueReceivers', '1');
    });

    test('Should properly calculate BulkTransfer event in statistics', () => {
      const bulkTransfer1 = createBulkTransferEvent(1, 3, BigInt.fromI32(10));
      const bulkTransfer2 = createBulkTransferEvent(2, 3, BigInt.fromI32(10));

      handleBulkTransfer(bulkTransfer1);
      handleBulkTransfer(bulkTransfer2);

      assert.fieldEquals(
        'HMTokenStatistics',
        HMT_STATISTICS_ENTITY_ID.toHex(),
        'totalBulkTransferEventCount',
        '2'
      );
    });

    test('Should properly calculate Approval event in statistics', () => {
      const approval1 = createApprovalEvent(
        holder1AddressString,
        operatorAddressString,
        10,
        BigInt.fromI32(10)
      );

      const approval2 = createApprovalEvent(
        holder1AddressString,
        operatorAddressString,
        10,
        BigInt.fromI32(10)
      );

      handleApproval(approval1);
      handleApproval(approval2);

      assert.fieldEquals(
        'HMTokenStatistics',
        HMT_STATISTICS_ENTITY_ID.toHex(),
        'totalApprovalEventCount',
        '2'
      );
    });

    test('Should properly calculate BulkApproval event in statistics', () => {
      const bulkApproval1 = createBulkApprovalEvent(1, 3, BigInt.fromI32(10));
      const bulkApproval2 = createBulkApprovalEvent(2, 3, BigInt.fromI32(10));

      handleBulkApproval(bulkApproval1);
      handleBulkApproval(bulkApproval2);

      assert.fieldEquals(
        'HMTokenStatistics',
        HMT_STATISTICS_ENTITY_ID.toHex(),
        'totalBulkApprovalEventCount',
        '2'
      );
    });
  });
});
