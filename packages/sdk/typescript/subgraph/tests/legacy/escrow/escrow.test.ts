import {
  Address,
  BigInt,
  DataSourceContext,
  ethereum,
} from '@graphprotocol/graph-ts';
import {
  afterAll,
  beforeAll,
  describe,
  test,
  assert,
  clearStore,
  dataSourceMock,
  beforeEach,
  createMockedFunction,
} from 'matchstick-as/assembly';

import { Escrow } from '../../../generated/schema';
import { STATISTICS_ENTITY_ID } from '../../../src/mapping/Escrow';
import {
  handleIntermediateStorage,
  handlePending,
  handleBulkTransfer,
} from '../../../src/mapping/legacy/Escrow';
import { ZERO_BI } from '../../../src/mapping/utils/number';
import {
  createISEvent,
  createPendingEvent,
  createBulkTransferEvent,
} from './fixtures';

const escrowAddressString = '0xa16081f360e3847006db660bae1c6d1b2e17ec2a';
const escrowAddress = Address.fromString(escrowAddressString);
const operatorAddressString = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
const operatorAddress = Address.fromString(operatorAddressString);
const workerAddressString = '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc';
const workerAddress = Address.fromString(workerAddressString);
// const worker2AddressString = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8';
// const worker2Address = Address.fromString(worker2AddressString);
const reputationOracleAddressString =
  '0x70997970c51812dc3a010c7d01b50e0d17dc79c9';
const reputationOracleAddress = Address.fromString(
  reputationOracleAddressString
);
const recordingOracleAddressString =
  '0x70997970c51812dc3a010c7d01b50e0d17dc79c0';
const recordingOracleAddress = Address.fromString(recordingOracleAddressString);
const launcherAddressString = '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65';
const launcherAddress = Address.fromString(launcherAddressString);

describe('Escrow', () => {
  beforeAll(() => {
    dataSourceMock.setReturnValues(
      escrowAddressString,
      'rinkeby',
      new DataSourceContext()
    );

    createMockedFunction(
      escrowAddress,
      'reputationOracle',
      'reputationOracle():(address)'
    ).returns([ethereum.Value.fromAddress(reputationOracleAddress)]);
    createMockedFunction(
      escrowAddress,
      'recordingOracle',
      'recordingOracle():(address)'
    ).returns([ethereum.Value.fromAddress(recordingOracleAddress)]);
    createMockedFunction(
      escrowAddress,
      'finalResultsUrl',
      'finalResultsUrl():(string)'
    ).returns([ethereum.Value.fromString('test.com')]);
    createMockedFunction(
      escrowAddress,
      'reputationOracleStake',
      'reputationOracleStake():(uint256)'
    ).returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(10))]);
    createMockedFunction(
      escrowAddress,
      'recordingOracleStake',
      'recordingOracleStake():(uint256)'
    ).returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(20))]);

    const escrow = new Escrow(escrowAddress.toHex());
    escrow.address = escrowAddress;
    escrow.token = Address.zero();
    escrow.factoryAddress = Address.zero();
    escrow.launcher = launcherAddress;
    escrow.count = ZERO_BI;
    escrow.balance = BigInt.fromI32(100);
    escrow.totalFundedAmount = BigInt.fromI32(100);
    escrow.amountPaid = ZERO_BI;
    escrow.status = 'Launched';
    escrow.createdAt = BigInt.fromI32(0);

    escrow.save();
  });

  afterAll(() => {
    dataSourceMock.resetValues();
  });

  test('Should properly handle Pending event', () => {
    const URL = 'test.com';
    const HASH = 'is_hash_1';

    const newPending1 = createPendingEvent(operatorAddress, URL, HASH);

    handlePending(newPending1);

    const id = `${newPending1.transaction.hash.toHex()}-${newPending1.logIndex.toString()}-${
      newPending1.block.timestamp
    }`;

    // SetupEvent
    assert.fieldEquals(
      'SetupEvent',
      id,
      'block',
      newPending1.block.number.toString()
    );
    assert.fieldEquals(
      'SetupEvent',
      id,
      'timestamp',
      newPending1.block.timestamp.toString()
    );
    assert.fieldEquals(
      'SetupEvent',
      id,
      'txHash',
      newPending1.transaction.hash.toHex()
    );
    assert.fieldEquals('SetupEvent', id, 'escrowAddress', escrowAddressString);
    assert.fieldEquals('SetupEvent', id, 'sender', operatorAddressString);

    // Escrow
    assert.fieldEquals('Escrow', escrowAddress.toHex(), 'status', 'Pending');
    assert.fieldEquals('Escrow', escrowAddress.toHex(), 'manifestUrl', URL);
    assert.fieldEquals('Escrow', escrowAddress.toHex(), 'manifestHash', HASH);
    assert.fieldEquals(
      'Escrow',
      escrowAddress.toHex(),
      'reputationOracle',
      reputationOracleAddressString
    );
    assert.fieldEquals(
      'Escrow',
      escrowAddress.toHex(),
      'recordingOracle',
      recordingOracleAddressString
    );
    assert.fieldEquals(
      'Transaction',
      newPending1.transaction.hash.toHex(),
      'txHash',
      newPending1.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'Transaction',
      newPending1.transaction.hash.toHex(),
      'method',
      'setup'
    );
    assert.fieldEquals(
      'Transaction',
      newPending1.transaction.hash.toHex(),
      'block',
      newPending1.block.number.toString()
    );
    assert.fieldEquals(
      'Transaction',
      newPending1.transaction.hash.toHex(),
      'from',
      newPending1.transaction.from.toHex()
    );
    assert.fieldEquals(
      'Transaction',
      newPending1.transaction.hash.toHex(),
      'to',
      escrowAddressString
    );
  });

  test('should properly handle IntermediateStorage event', () => {
    const URL = 'test.com';
    const newIS = createISEvent(workerAddress, URL, 'is_hash_1');
    handleIntermediateStorage(newIS);

    const id = `${newIS.transaction.hash.toHex()}-${newIS.logIndex.toString()}-${
      newIS.block.timestamp
    }`;

    // StoreResultsEvent
    assert.fieldEquals(
      'StoreResultsEvent',
      id,
      'block',
      newIS.block.number.toString()
    );
    assert.fieldEquals(
      'StoreResultsEvent',
      id,
      'timestamp',
      newIS.block.timestamp.toString()
    );
    assert.fieldEquals(
      'StoreResultsEvent',
      id,
      'txHash',
      newIS.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'StoreResultsEvent',
      id,
      'escrowAddress',
      escrowAddressString
    );
    assert.fieldEquals('StoreResultsEvent', id, 'sender', workerAddressString);
    assert.fieldEquals('StoreResultsEvent', id, 'intermediateResultsUrl', URL);
    assert.fieldEquals(
      'Transaction',
      newIS.transaction.hash.toHex(),
      'txHash',
      newIS.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'Transaction',
      newIS.transaction.hash.toHex(),
      'method',
      'storeResults'
    );
    assert.fieldEquals(
      'Transaction',
      newIS.transaction.hash.toHex(),
      'block',
      newIS.block.number.toString()
    );
    assert.fieldEquals(
      'Transaction',
      newIS.transaction.hash.toHex(),
      'from',
      newIS.transaction.from.toHex()
    );
    assert.fieldEquals(
      'Transaction',
      newIS.transaction.hash.toHex(),
      'to',
      escrowAddressString
    );
  });

  test('Should properly handle BulkTransfer events with partially paid status', () => {
    createMockedFunction(escrowAddress, 'status', 'status():(uint8)').returns([
      ethereum.Value.fromI32(2),
    ]);

    // Bulk 1
    const bulk1 = createBulkTransferEvent(
      operatorAddress,
      1,
      2,
      BigInt.fromI32(10)
    );

    handleBulkTransfer(bulk1);

    const id1 = `${bulk1.transaction.hash.toHex()}-${bulk1.logIndex.toString()}-${
      bulk1.block.timestamp
    }`;

    // BulkPayoutEvent
    assert.fieldEquals(
      'BulkPayoutEvent',
      id1,
      'block',
      bulk1.block.number.toString()
    );
    assert.fieldEquals(
      'BulkPayoutEvent',
      id1,
      'timestamp',
      bulk1.block.timestamp.toString()
    );
    assert.fieldEquals(
      'BulkPayoutEvent',
      id1,
      'txHash',
      bulk1.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'BulkPayoutEvent',
      id1,
      'escrowAddress',
      escrowAddressString
    );
    assert.fieldEquals('BulkPayoutEvent', id1, 'sender', operatorAddressString);
    assert.fieldEquals('BulkPayoutEvent', id1, 'bulkPayoutTxId', '1');
    assert.fieldEquals('BulkPayoutEvent', id1, 'bulkCount', '2');

    // Escrow
    assert.fieldEquals(
      'Escrow',
      escrowAddress.toHex(),
      'status',
      'Partially Paid'
    );
    assert.fieldEquals(
      'Transaction',
      bulk1.transaction.hash.toHex(),
      'txHash',
      bulk1.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'Transaction',
      bulk1.transaction.hash.toHex(),
      'method',
      'bulkTransfer'
    );
    assert.fieldEquals(
      'Transaction',
      bulk1.transaction.hash.toHex(),
      'block',
      bulk1.block.number.toString()
    );
    assert.fieldEquals(
      'Transaction',
      bulk1.transaction.hash.toHex(),
      'from',
      bulk1.transaction.from.toHex()
    );
    assert.fieldEquals(
      'Transaction',
      bulk1.transaction.hash.toHex(),
      'to',
      escrowAddressString
    );
  });

  test('Should properly handle BulkTransfer events with fully paid status', () => {
    createMockedFunction(escrowAddress, 'status', 'status():(uint8)').returns([
      ethereum.Value.fromI32(3),
    ]);

    // Bulk 1
    const bulk1 = createBulkTransferEvent(
      operatorAddress,
      1,
      2,
      BigInt.fromI32(10)
    );

    handleBulkTransfer(bulk1);

    const id1 = `${bulk1.transaction.hash.toHex()}-${bulk1.logIndex.toString()}-${
      bulk1.block.timestamp
    }`;

    // BulkPayoutEvent
    assert.fieldEquals(
      'BulkPayoutEvent',
      id1,
      'block',
      bulk1.block.number.toString()
    );
    assert.fieldEquals(
      'BulkPayoutEvent',
      id1,
      'timestamp',
      bulk1.block.timestamp.toString()
    );
    assert.fieldEquals(
      'BulkPayoutEvent',
      id1,
      'txHash',
      bulk1.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'BulkPayoutEvent',
      id1,
      'escrowAddress',
      escrowAddressString
    );
    assert.fieldEquals('BulkPayoutEvent', id1, 'sender', operatorAddressString);
    assert.fieldEquals('BulkPayoutEvent', id1, 'bulkPayoutTxId', '1');
    assert.fieldEquals('BulkPayoutEvent', id1, 'bulkCount', '2');

    // Escrow
    assert.fieldEquals('Escrow', escrowAddress.toHex(), 'status', 'Paid');
    assert.fieldEquals(
      'Transaction',
      bulk1.transaction.hash.toHex(),
      'txHash',
      bulk1.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'Transaction',
      bulk1.transaction.hash.toHex(),
      'method',
      'bulkTransfer'
    );
    assert.fieldEquals(
      'Transaction',
      bulk1.transaction.hash.toHex(),
      'block',
      bulk1.block.number.toString()
    );
    assert.fieldEquals(
      'Transaction',
      bulk1.transaction.hash.toHex(),
      'from',
      bulk1.transaction.from.toHex()
    );
    assert.fieldEquals(
      'Transaction',
      bulk1.transaction.hash.toHex(),
      'to',
      escrowAddressString
    );
  });

  describe('Statistics', () => {
    beforeEach(() => {
      clearStore();
    });

    test('Should properly calculate setup & pending in statistics', () => {
      const newPending1 = createPendingEvent(
        operatorAddress,
        'test.com',
        'is_hash_1'
      );
      const newPending2 = createPendingEvent(
        operatorAddress,
        'test.com',
        'is_hash_1'
      );

      handlePending(newPending1);
      handlePending(newPending2);

      assert.fieldEquals(
        'EscrowStatistics',
        STATISTICS_ENTITY_ID,
        'setupEventCount',
        '2'
      );
      assert.fieldEquals(
        'EscrowStatistics',
        STATISTICS_ENTITY_ID,
        'pendingStatusEventCount',
        '2'
      );

      [
        'fundEventCount',
        'storeResultsEventCount',
        'bulkPayoutEventCount',
        'cancelledStatusEventCount',
        'partialStatusEventCount',
        'paidStatusEventCount',
        'completedStatusEventCount',
      ].forEach((field) => {
        assert.fieldEquals(
          'EscrowStatistics',
          STATISTICS_ENTITY_ID,
          field,
          '0'
        );
      });

      assert.fieldEquals(
        'EscrowStatistics',
        STATISTICS_ENTITY_ID,
        'totalEventCount',
        '4'
      );
    });

    test('Should properly calculate StoreResults event in statistics', () => {
      const newIS = createISEvent(workerAddress, 'test.com', 'is_hash_1');
      const newIS1 = createISEvent(workerAddress, 'test.com', 'is_hash_1');

      handleIntermediateStorage(newIS);
      handleIntermediateStorage(newIS1);

      assert.fieldEquals(
        'EscrowStatistics',
        STATISTICS_ENTITY_ID,
        'storeResultsEventCount',
        '2'
      );

      [
        'fundEventCount',
        'setupEventCount',
        'bulkPayoutEventCount',
        'pendingStatusEventCount',
        'cancelledStatusEventCount',
        'partialStatusEventCount',
        'paidStatusEventCount',
        'completedStatusEventCount',
      ].forEach((field) => {
        assert.fieldEquals(
          'EscrowStatistics',
          STATISTICS_ENTITY_ID,
          field,
          '0'
        );
      });

      assert.fieldEquals(
        'EscrowStatistics',
        STATISTICS_ENTITY_ID,
        'totalEventCount',
        '2'
      );
    });

    test('Should properly calculate bulkPayout, partialStatus, paidStatus event in statistics', () => {
      dataSourceMock.setReturnValues(
        escrowAddressString,
        'rinkeby',
        new DataSourceContext()
      );

      const escrow = new Escrow(escrowAddress.toHex());
      escrow.address = escrowAddress;
      escrow.token = Address.zero();
      escrow.factoryAddress = Address.zero();
      escrow.launcher = Address.zero();
      escrow.count = ZERO_BI;
      escrow.balance = BigInt.fromI32(100);
      escrow.totalFundedAmount = BigInt.fromI32(100);
      escrow.amountPaid = ZERO_BI;
      escrow.status = 'Launched';
      escrow.createdAt = BigInt.fromI32(0);

      escrow.save();

      createMockedFunction(escrowAddress, 'status', 'status():(uint8)').returns(
        [ethereum.Value.fromI32(2)]
      );

      handleBulkTransfer(
        createBulkTransferEvent(operatorAddress, 1, 5, BigInt.fromI32(11))
      );

      createMockedFunction(escrowAddress, 'status', 'status():(uint8)').returns(
        [ethereum.Value.fromI32(3)]
      );

      handleBulkTransfer(
        createBulkTransferEvent(operatorAddress, 1, 5, BigInt.fromI32(11))
      );

      assert.fieldEquals(
        'EscrowStatistics',
        STATISTICS_ENTITY_ID,
        'bulkPayoutEventCount',
        '2'
      );
      assert.fieldEquals(
        'EscrowStatistics',
        STATISTICS_ENTITY_ID,
        'partialStatusEventCount',
        '1'
      );
      assert.fieldEquals(
        'EscrowStatistics',
        STATISTICS_ENTITY_ID,
        'paidStatusEventCount',
        '1'
      );

      [
        'fundEventCount',
        'setupEventCount',
        'storeResultsEventCount',
        'pendingStatusEventCount',
        'cancelledStatusEventCount',
        'completedStatusEventCount',
      ].forEach((field) => {
        assert.fieldEquals(
          'EscrowStatistics',
          STATISTICS_ENTITY_ID,
          field,
          '0'
        );
      });

      assert.fieldEquals(
        'EscrowStatistics',
        STATISTICS_ENTITY_ID,
        'totalEventCount',
        '4'
      );
    });
  });
});
