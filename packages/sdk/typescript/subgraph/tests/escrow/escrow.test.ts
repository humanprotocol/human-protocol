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

import { Escrow } from '../../generated/schema';
import {
  STATISTICS_ENTITY_ID,
  handleIntermediateStorage,
  handlePending,
  handleBulkTransfer,
  handleCancelled,
  handleCompleted,
  handleFund,
  handlePendingV2,
  handleBulkTransferV2,
} from '../../src/mapping/Escrow';
import { toEventId } from '../../src/mapping/utils/event';
import { ZERO_BI } from '../../src/mapping/utils/number';
import {
  createISEvent,
  createPendingEvent,
  createBulkTransferEvent,
  createCancelledEvent,
  createCompletedEvent,
  createFundEvent,
  createPendingV2Event,
  createBulkTransferV2Event,
} from './fixtures';

const escrowAddressString = '0xa16081f360e3847006db660bae1c6d1b2e17ec2a';
const escrowAddress = Address.fromString(escrowAddressString);
const operatorAddressString = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
const operatorAddress = Address.fromString(operatorAddressString);
const workerAddressString = '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc';
const workerAddress = Address.fromString(workerAddressString);
const worker2AddressString = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8';
const worker2Address = Address.fromString(worker2AddressString);
const reputationOracleAddressString =
  '0x70997970c51812dc3a010c7d01b50e0d17dc79c9';
const reputationOracleAddress = Address.fromString(
  reputationOracleAddressString
);
const recordingOracleAddressString =
  '0x70997970c51812dc3a010c7d01b50e0d17dc79c0';
const recordingOracleAddress = Address.fromString(recordingOracleAddressString);
const exchangeOracleAddressString =
  '0x70997970c51812dc3a010c7d01b50e0d17dc79cb';
const exchangeOracleAddress = Address.fromString(exchangeOracleAddressString);
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

    const escrow = new Escrow(escrowAddress);
    escrow.address = escrowAddress;
    escrow.token = Address.zero();
    escrow.factoryAddress = Address.zero();
    escrow.launcher = launcherAddress;
    escrow.count = ZERO_BI;
    escrow.balance = ZERO_BI;
    escrow.totalFundedAmount = ZERO_BI;
    escrow.amountPaid = ZERO_BI;
    escrow.status = 'Launched';
    escrow.createdAt = ZERO_BI;

    escrow.save();
  });

  afterAll(() => {
    dataSourceMock.resetValues();
  });

  test('Should properly handle Pending event for old contract', () => {
    const URL = 'test.com';
    const HASH = 'is_hash_1';

    createMockedFunction(
      escrowAddress,
      'exchangeOracle',
      'exchangeOracle():(address)'
    ).reverts();

    const newPending1 = createPendingEvent(operatorAddress, URL, HASH);

    handlePending(newPending1);

    const id = toEventId(newPending1).toHex();

    // PendingEvent
    assert.fieldEquals(
      'PendingEvent',
      id,
      'block',
      newPending1.block.number.toString()
    );
    assert.fieldEquals(
      'PendingEvent',
      id,
      'timestamp',
      newPending1.block.timestamp.toString()
    );
    assert.fieldEquals(
      'PendingEvent',
      id,
      'txHash',
      newPending1.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'PendingEvent',
      id,
      'escrowAddress',
      escrowAddressString
    );
    assert.fieldEquals('PendingEvent', id, 'sender', operatorAddressString);

    // EscrowStatusEvent
    assert.fieldEquals(
      'EscrowStatusEvent',
      id,
      'block',
      newPending1.block.number.toString()
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id,
      'timestamp',
      newPending1.block.timestamp.toString()
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id,
      'txHash',
      newPending1.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id,
      'escrowAddress',
      escrowAddressString
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id,
      'sender',
      operatorAddressString
    );
    assert.fieldEquals('EscrowStatusEvent', id, 'status', 'Pending');
    assert.fieldEquals(
      'EscrowStatusEvent',
      id,
      'launcher',
      launcherAddressString
    );

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

  test('Should properly handle Pending event for old event, without exchange oracle', () => {
    const URL = 'test.com';
    const HASH = 'is_hash_1';

    createMockedFunction(
      escrowAddress,
      'exchangeOracle',
      'exchangeOracle():(address)'
    ).reverts();

    const newPending1 = createPendingEvent(operatorAddress, URL, HASH);

    handlePending(newPending1);

    const id = toEventId(newPending1).toHex();

    // PendingEvent
    assert.fieldEquals(
      'PendingEvent',
      id,
      'block',
      newPending1.block.number.toString()
    );
    assert.fieldEquals(
      'PendingEvent',
      id,
      'timestamp',
      newPending1.block.timestamp.toString()
    );
    assert.fieldEquals(
      'PendingEvent',
      id,
      'txHash',
      newPending1.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'PendingEvent',
      id,
      'escrowAddress',
      escrowAddressString
    );
    assert.fieldEquals('PendingEvent', id, 'sender', operatorAddressString);

    // EscrowStatusEvent
    assert.fieldEquals(
      'EscrowStatusEvent',
      id,
      'block',
      newPending1.block.number.toString()
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id,
      'timestamp',
      newPending1.block.timestamp.toString()
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id,
      'txHash',
      newPending1.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id,
      'escrowAddress',
      escrowAddressString
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id,
      'sender',
      operatorAddressString
    );
    assert.fieldEquals('EscrowStatusEvent', id, 'status', 'Pending');
    assert.fieldEquals(
      'EscrowStatusEvent',
      id,
      'launcher',
      launcherAddressString
    );

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

    // Leader
    assert.fieldEquals(
      'Leader',
      reputationOracleAddressString,
      'amountJobsProcessed',
      '2'
    );

    assert.fieldEquals(
      'Leader',
      recordingOracleAddressString,
      'amountJobsProcessed',
      '2'
    );
  });

  test('Should properly handle Pending event for old event, with exchange oracle', () => {
    const URL = 'test.com';
    const HASH = 'is_hash_1';

    createMockedFunction(
      escrowAddress,
      'exchangeOracle',
      'exchangeOracle():(address)'
    ).returns([ethereum.Value.fromAddress(exchangeOracleAddress)]);

    const newPending1 = createPendingEvent(operatorAddress, URL, HASH);

    handlePending(newPending1);

    const id = toEventId(newPending1).toHex();

    // PendingEvent
    assert.fieldEquals(
      'PendingEvent',
      id,
      'block',
      newPending1.block.number.toString()
    );
    assert.fieldEquals(
      'PendingEvent',
      id,
      'timestamp',
      newPending1.block.timestamp.toString()
    );
    assert.fieldEquals(
      'PendingEvent',
      id,
      'txHash',
      newPending1.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'PendingEvent',
      id,
      'escrowAddress',
      escrowAddressString
    );
    assert.fieldEquals('PendingEvent', id, 'sender', operatorAddressString);

    // EscrowStatusEvent
    assert.fieldEquals(
      'EscrowStatusEvent',
      id,
      'block',
      newPending1.block.number.toString()
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id,
      'timestamp',
      newPending1.block.timestamp.toString()
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id,
      'txHash',
      newPending1.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id,
      'escrowAddress',
      escrowAddressString
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id,
      'sender',
      operatorAddressString
    );
    assert.fieldEquals('EscrowStatusEvent', id, 'status', 'Pending');
    assert.fieldEquals(
      'EscrowStatusEvent',
      id,
      'launcher',
      launcherAddressString
    );

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
      'Escrow',
      escrowAddress.toHex(),
      'exchangeOracle',
      exchangeOracleAddressString
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

    // Leader
    assert.fieldEquals(
      'Leader',
      reputationOracleAddressString,
      'amountJobsProcessed',
      '3'
    );

    assert.fieldEquals(
      'Leader',
      recordingOracleAddressString,
      'amountJobsProcessed',
      '3'
    );

    assert.fieldEquals(
      'Leader',
      exchangeOracleAddressString,
      'amountJobsProcessed',
      '1'
    );
  });

  test('Should properly handle Fund event', () => {
    const fund = createFundEvent(operatorAddress, 100, BigInt.fromI32(10));

    handleFund(fund);

    const id = toEventId(fund).toHex();

    // FundEvent
    assert.fieldEquals('FundEvent', id, 'block', fund.block.number.toString());
    assert.fieldEquals(
      'FundEvent',
      id,
      'timestamp',
      fund.block.timestamp.toString()
    );
    assert.fieldEquals(
      'FundEvent',
      id,
      'txHash',
      fund.transaction.hash.toHex()
    );
    assert.fieldEquals('FundEvent', id, 'escrowAddress', escrowAddressString);
    assert.fieldEquals('FundEvent', id, 'sender', operatorAddressString);
    assert.fieldEquals('FundEvent', id, 'amount', '100');

    // Escrow
    assert.fieldEquals('Escrow', escrowAddressString, 'balance', '100');
    assert.fieldEquals(
      'Escrow',
      escrowAddressString,
      'totalFundedAmount',
      '100'
    );
    assert.fieldEquals(
      'Transaction',
      fund.transaction.hash.toHex(),
      'txHash',
      fund.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'Transaction',
      fund.transaction.hash.toHex(),
      'method',
      'fund'
    );
    assert.fieldEquals(
      'Transaction',
      fund.transaction.hash.toHex(),
      'block',
      fund.block.number.toString()
    );
    assert.fieldEquals(
      'Transaction',
      fund.transaction.hash.toHex(),
      'from',
      fund.transaction.from.toHex()
    );
    assert.fieldEquals(
      'Transaction',
      fund.transaction.hash.toHex(),
      'to',
      escrowAddressString
    );
    assert.fieldEquals(
      'Transaction',
      fund.transaction.hash.toHex(),
      'value',
      '100'
    );
  });

  test('Should skip Fund event if balance is greater than 0', () => {
    const fund = createFundEvent(operatorAddress, 100, BigInt.fromI32(10));

    handleFund(fund);

    // Escrow
    assert.fieldEquals('Escrow', escrowAddressString, 'balance', '100');
    assert.fieldEquals(
      'Escrow',
      escrowAddressString,
      'totalFundedAmount',
      '100'
    );
  });

  test('Should properly handle Pending event for new event', () => {
    const URL = 'test.com';
    const HASH = 'is_hash_1';

    const newPending1 = createPendingV2Event(
      operatorAddress,
      URL,
      HASH,
      reputationOracleAddress,
      recordingOracleAddress,
      exchangeOracleAddress
    );

    handlePendingV2(newPending1);

    const id = toEventId(newPending1).toHex();

    // PendingEvent
    assert.fieldEquals(
      'PendingEvent',
      id,
      'block',
      newPending1.block.number.toString()
    );
    assert.fieldEquals(
      'PendingEvent',
      id,
      'timestamp',
      newPending1.block.timestamp.toString()
    );
    assert.fieldEquals(
      'PendingEvent',
      id,
      'txHash',
      newPending1.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'PendingEvent',
      id,
      'escrowAddress',
      escrowAddressString
    );
    assert.fieldEquals('PendingEvent', id, 'sender', operatorAddressString);

    // EscrowStatusEvent
    assert.fieldEquals(
      'EscrowStatusEvent',
      id,
      'block',
      newPending1.block.number.toString()
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id,
      'timestamp',
      newPending1.block.timestamp.toString()
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id,
      'txHash',
      newPending1.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id,
      'escrowAddress',
      escrowAddressString
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id,
      'sender',
      operatorAddressString
    );
    assert.fieldEquals('EscrowStatusEvent', id, 'status', 'Pending');
    assert.fieldEquals(
      'EscrowStatusEvent',
      id,
      'launcher',
      launcherAddressString
    );

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

    // Leader
    assert.fieldEquals(
      'Leader',
      reputationOracleAddressString,
      'amountJobsProcessed',
      '4'
    );

    assert.fieldEquals(
      'Leader',
      recordingOracleAddressString,
      'amountJobsProcessed',
      '4'
    );

    assert.fieldEquals(
      'Leader',
      exchangeOracleAddressString,
      'amountJobsProcessed',
      '2'
    );
  });

  test('should properly handle IntermediateStorage event', () => {
    const URL = 'test.com';
    const newIS = createISEvent(workerAddress, URL, 'is_hash_1');
    handleIntermediateStorage(newIS);

    const id = toEventId(newIS).toHex();

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

  test('Should properly handle BulkTransfer events', () => {
    // Bulk 1
    const bulk1 = createBulkTransferEvent(
      operatorAddress,
      1,
      [workerAddress, workerAddress],
      [1, 1],
      true,
      BigInt.fromI32(10)
    );

    handleBulkTransfer(bulk1);

    const id1 = toEventId(bulk1).toHex();

    // BulkPayoutEvent;
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

    // EscrowStatusEvent
    assert.fieldEquals(
      'EscrowStatusEvent',
      id1,
      'block',
      bulk1.block.number.toString()
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id1,
      'timestamp',
      bulk1.block.timestamp.toString()
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id1,
      'txHash',
      bulk1.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id1,
      'escrowAddress',
      escrowAddressString
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id1,
      'sender',
      operatorAddressString
    );
    assert.fieldEquals('EscrowStatusEvent', id1, 'status', 'Partial');
    assert.fieldEquals(
      'EscrowStatusEvent',
      id1,
      'launcher',
      launcherAddressString
    );

    // Escrow
    assert.fieldEquals('Escrow', escrowAddress.toHex(), 'status', 'Partial');
    assert.fieldEquals('Escrow', escrowAddress.toHex(), 'balance', '98');

    // Bulk 2
    const bulk2 = createBulkTransferEvent(
      operatorAddress,
      3,
      [workerAddress, workerAddress, workerAddress, worker2Address],
      [1, 1, 1, 95],
      false,
      BigInt.fromI32(11)
    );

    handleBulkTransfer(bulk2);

    const id2 = toEventId(bulk2).toHex();

    assert.fieldEquals(
      'BulkPayoutEvent',
      id2,
      'block',
      bulk2.block.number.toString()
    );
    assert.fieldEquals(
      'BulkPayoutEvent',
      id2,
      'timestamp',
      bulk2.block.timestamp.toString()
    );
    assert.fieldEquals(
      'BulkPayoutEvent',
      id2,
      'txHash',
      bulk2.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'BulkPayoutEvent',
      id2,
      'escrowAddress',
      escrowAddressString
    );
    assert.fieldEquals('BulkPayoutEvent', id2, 'sender', operatorAddressString);
    assert.fieldEquals('BulkPayoutEvent', id2, 'bulkPayoutTxId', '3');
    assert.fieldEquals('BulkPayoutEvent', id2, 'bulkCount', '4');

    // EscrowStatusEvent
    assert.fieldEquals(
      'EscrowStatusEvent',
      id2,
      'block',
      bulk2.block.number.toString()
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id2,
      'timestamp',
      bulk2.block.timestamp.toString()
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id2,
      'txHash',
      bulk2.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id2,
      'escrowAddress',
      escrowAddressString
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id2,
      'sender',
      operatorAddressString
    );
    assert.fieldEquals('EscrowStatusEvent', id2, 'status', 'Paid');
    assert.fieldEquals(
      'EscrowStatusEvent',
      id2,
      'launcher',
      launcherAddressString
    );

    // Escrow
    assert.fieldEquals('Escrow', escrowAddress.toHex(), 'status', 'Paid');
    assert.fieldEquals(
      'Escrow',
      escrowAddress.toHex(),
      'finalResultsUrl',
      'test.com'
    );
    assert.fieldEquals('Escrow', escrowAddress.toHex(), 'balance', '0');
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

  test('Should properly handle BulkTransfer events', () => {
    // Bulk 1
    const bulk1 = createBulkTransferV2Event(
      operatorAddress,
      1,
      [workerAddress, workerAddress],
      [1, 1],
      true,
      'test.com',
      BigInt.fromI32(10)
    );

    handleBulkTransferV2(bulk1);

    const id1 = toEventId(bulk1).toHex();

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

    // EscrowStatusEvent
    assert.fieldEquals(
      'EscrowStatusEvent',
      id1,
      'block',
      bulk1.block.number.toString()
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id1,
      'timestamp',
      bulk1.block.timestamp.toString()
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id1,
      'txHash',
      bulk1.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id1,
      'escrowAddress',
      escrowAddressString
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id1,
      'sender',
      operatorAddressString
    );
    assert.fieldEquals('EscrowStatusEvent', id1, 'status', 'Partial');
    assert.fieldEquals(
      'EscrowStatusEvent',
      id1,
      'launcher',
      launcherAddressString
    );

    // Escrow
    assert.fieldEquals('Escrow', escrowAddress.toHex(), 'status', 'Partial');

    // Bulk 2
    const bulk2 = createBulkTransferV2Event(
      operatorAddress,
      3,
      [workerAddress, workerAddress, workerAddress, worker2Address],
      [1, 1, 1, 95],
      false,
      'test.com',
      BigInt.fromI32(11)
    );

    handleBulkTransferV2(bulk2);

    const id2 = toEventId(bulk2).toHex();

    assert.fieldEquals(
      'BulkPayoutEvent',
      id2,
      'block',
      bulk2.block.number.toString()
    );
    assert.fieldEquals(
      'BulkPayoutEvent',
      id2,
      'timestamp',
      bulk2.block.timestamp.toString()
    );
    assert.fieldEquals(
      'BulkPayoutEvent',
      id2,
      'txHash',
      bulk2.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'BulkPayoutEvent',
      id2,
      'escrowAddress',
      escrowAddressString
    );
    assert.fieldEquals('BulkPayoutEvent', id2, 'sender', operatorAddressString);
    assert.fieldEquals('BulkPayoutEvent', id2, 'bulkPayoutTxId', '3');
    assert.fieldEquals('BulkPayoutEvent', id2, 'bulkCount', '4');

    // EscrowStatusEvent
    assert.fieldEquals(
      'EscrowStatusEvent',
      id2,
      'block',
      bulk2.block.number.toString()
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id2,
      'timestamp',
      bulk2.block.timestamp.toString()
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id2,
      'txHash',
      bulk2.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id2,
      'escrowAddress',
      escrowAddressString
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id2,
      'sender',
      operatorAddressString
    );
    assert.fieldEquals('EscrowStatusEvent', id2, 'status', 'Paid');
    assert.fieldEquals(
      'EscrowStatusEvent',
      id2,
      'launcher',
      launcherAddressString
    );

    // Escrow
    assert.fieldEquals('Escrow', escrowAddress.toHex(), 'status', 'Paid');
    assert.fieldEquals(
      'Escrow',
      escrowAddress.toHex(),
      'finalResultsUrl',
      'test.com'
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

  test('Should properly handle Cancelled event', () => {
    const newCancelled = createCancelledEvent(operatorAddress);

    handleCancelled(newCancelled);

    const id = toEventId(newCancelled).toHex();

    // EscrowStatusEvent
    assert.fieldEquals(
      'EscrowStatusEvent',
      id,
      'block',
      newCancelled.block.number.toString()
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id,
      'timestamp',
      newCancelled.block.timestamp.toString()
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id,
      'txHash',
      newCancelled.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id,
      'escrowAddress',
      escrowAddressString
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id,
      'sender',
      operatorAddressString
    );
    assert.fieldEquals('EscrowStatusEvent', id, 'status', 'Cancelled');
    assert.fieldEquals(
      'EscrowStatusEvent',
      id,
      'launcher',
      launcherAddressString
    );

    // Escrow
    assert.fieldEquals('Escrow', escrowAddress.toHex(), 'status', 'Cancelled');
    assert.fieldEquals(
      'Transaction',
      newCancelled.transaction.hash.toHex(),
      'txHash',
      newCancelled.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'Transaction',
      newCancelled.transaction.hash.toHex(),
      'method',
      'cancel'
    );
    assert.fieldEquals(
      'Transaction',
      newCancelled.transaction.hash.toHex(),
      'block',
      newCancelled.block.number.toString()
    );
    assert.fieldEquals(
      'Transaction',
      newCancelled.transaction.hash.toHex(),
      'from',
      newCancelled.transaction.from.toHex()
    );
    assert.fieldEquals(
      'Transaction',
      newCancelled.transaction.hash.toHex(),
      'to',
      escrowAddressString
    );
  });

  test('Should properly handle Completed event', () => {
    const newCompleted = createCompletedEvent(operatorAddress);

    handleCompleted(newCompleted);

    const id = toEventId(newCompleted).toHex();

    // EscrowStatusEvent
    assert.fieldEquals(
      'EscrowStatusEvent',
      id,
      'block',
      newCompleted.block.number.toString()
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id,
      'timestamp',
      newCompleted.block.timestamp.toString()
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id,
      'txHash',
      newCompleted.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id,
      'escrowAddress',
      escrowAddressString
    );
    assert.fieldEquals(
      'EscrowStatusEvent',
      id,
      'sender',
      operatorAddressString
    );
    assert.fieldEquals('EscrowStatusEvent', id, 'status', 'Complete');
    assert.fieldEquals(
      'EscrowStatusEvent',
      id,
      'launcher',
      launcherAddressString
    );

    // Escrow
    assert.fieldEquals('Escrow', escrowAddress.toHex(), 'status', 'Complete');
    assert.fieldEquals(
      'Transaction',
      newCompleted.transaction.hash.toHex(),
      'txHash',
      newCompleted.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'Transaction',
      newCompleted.transaction.hash.toHex(),
      'method',
      'complete'
    );
    assert.fieldEquals(
      'Transaction',
      newCompleted.transaction.hash.toHex(),
      'block',
      newCompleted.block.number.toString()
    );
    assert.fieldEquals(
      'Transaction',
      newCompleted.transaction.hash.toHex(),
      'from',
      newCompleted.transaction.from.toHex()
    );
    assert.fieldEquals(
      'Transaction',
      newCompleted.transaction.hash.toHex(),
      'to',
      escrowAddressString
    );
  });

  describe('Statistics', () => {
    beforeEach(() => {
      clearStore();
    });

    test('Should properly calculate setup & pending in statistics', () => {
      const newPending1 = createPendingV2Event(
        operatorAddress,
        'test.com',
        'is_hash_1',
        reputationOracleAddress,
        recordingOracleAddress,
        exchangeOracleAddress
      );
      const newPending2 = createPendingV2Event(
        operatorAddress,
        'test.com',
        'is_hash_1',
        reputationOracleAddress,
        recordingOracleAddress,
        exchangeOracleAddress
      );

      handlePendingV2(newPending1);
      handlePendingV2(newPending2);

      assert.fieldEquals(
        'EscrowStatistics',
        STATISTICS_ENTITY_ID.toHex(),
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
          STATISTICS_ENTITY_ID.toHex(),
          field,
          '0'
        );
      });

      assert.fieldEquals(
        'EscrowStatistics',
        STATISTICS_ENTITY_ID.toHex(),
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
        STATISTICS_ENTITY_ID.toHex(),
        'storeResultsEventCount',
        '2'
      );

      [
        'fundEventCount',
        'bulkPayoutEventCount',
        'pendingStatusEventCount',
        'cancelledStatusEventCount',
        'partialStatusEventCount',
        'paidStatusEventCount',
        'completedStatusEventCount',
      ].forEach((field) => {
        assert.fieldEquals(
          'EscrowStatistics',
          STATISTICS_ENTITY_ID.toHex(),
          field,
          '0'
        );
      });

      assert.fieldEquals(
        'EscrowStatistics',
        STATISTICS_ENTITY_ID.toHex(),
        'totalEventCount',
        '2'
      );
    });

    test('Should properly calculate bulkPayout, partialStatus, paidStatus event in statistics', () => {
      handleBulkTransferV2(
        createBulkTransferV2Event(
          operatorAddress,
          1,
          [
            workerAddress,
            workerAddress,
            workerAddress,
            workerAddress,
            workerAddress,
          ],
          [1, 1, 1, 1, 1],
          true,
          'test.com',
          BigInt.fromI32(11)
        )
      );
      handleBulkTransferV2(
        createBulkTransferV2Event(
          operatorAddress,
          2,
          [workerAddress, workerAddress, workerAddress, workerAddress],
          [1, 1, 1, 1],
          false,
          'test.com',
          BigInt.fromI32(11)
        )
      );

      assert.fieldEquals(
        'EscrowStatistics',
        STATISTICS_ENTITY_ID.toHex(),
        'bulkPayoutEventCount',
        '2'
      );
      assert.fieldEquals(
        'EscrowStatistics',
        STATISTICS_ENTITY_ID.toHex(),
        'partialStatusEventCount',
        '1'
      );
      assert.fieldEquals(
        'EscrowStatistics',
        STATISTICS_ENTITY_ID.toHex(),
        'paidStatusEventCount',
        '1'
      );

      [
        'fundEventCount',
        'storeResultsEventCount',
        'pendingStatusEventCount',
        'cancelledStatusEventCount',
        'completedStatusEventCount',
      ].forEach((field) => {
        assert.fieldEquals(
          'EscrowStatistics',
          STATISTICS_ENTITY_ID.toHex(),
          field,
          '0'
        );
      });

      assert.fieldEquals(
        'EscrowStatistics',
        STATISTICS_ENTITY_ID.toHex(),
        'totalEventCount',
        '4'
      );
    });

    test('Should properly calculate cancelled event in statstics', () => {
      const newCancelled1 = createCancelledEvent(operatorAddress);
      const newCancelled2 = createCancelledEvent(operatorAddress);

      handleCancelled(newCancelled1);
      handleCancelled(newCancelled2);

      assert.fieldEquals(
        'EscrowStatistics',
        STATISTICS_ENTITY_ID.toHex(),
        'cancelledStatusEventCount',
        '2'
      );

      [
        'fundEventCount',
        'storeResultsEventCount',
        'bulkPayoutEventCount',
        'pendingStatusEventCount',
        'partialStatusEventCount',
        'paidStatusEventCount',
        'completedStatusEventCount',
      ].forEach((field) => {
        assert.fieldEquals(
          'EscrowStatistics',
          STATISTICS_ENTITY_ID.toHex(),
          field,
          '0'
        );
      });

      assert.fieldEquals(
        'EscrowStatistics',
        STATISTICS_ENTITY_ID.toHex(),
        'totalEventCount',
        '2'
      );
    });

    test('Should properly calculate completed event in statstics', () => {
      const newCompleted1 = createCompletedEvent(operatorAddress);
      const newCompleted2 = createCompletedEvent(operatorAddress);

      handleCompleted(newCompleted1);
      handleCompleted(newCompleted2);

      assert.fieldEquals(
        'EscrowStatistics',
        STATISTICS_ENTITY_ID.toHex(),
        'completedStatusEventCount',
        '2'
      );

      [
        'fundEventCount',
        'storeResultsEventCount',
        'bulkPayoutEventCount',
        'pendingStatusEventCount',
        'cancelledStatusEventCount',
        'partialStatusEventCount',
        'paidStatusEventCount',
      ].forEach((field) => {
        assert.fieldEquals(
          'EscrowStatistics',
          STATISTICS_ENTITY_ID.toHex(),
          field,
          '0'
        );
      });

      assert.fieldEquals(
        'EscrowStatistics',
        STATISTICS_ENTITY_ID.toHex(),
        'totalEventCount',
        '2'
      );
    });

    test('Should properly calculate fund event in statstics', () => {
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

      const escrow = new Escrow(escrowAddress);
      escrow.address = escrowAddress;
      escrow.token = Address.zero();
      escrow.factoryAddress = Address.zero();
      escrow.launcher = launcherAddress;
      escrow.count = ZERO_BI;
      escrow.balance = ZERO_BI;
      escrow.totalFundedAmount = ZERO_BI;
      escrow.amountPaid = ZERO_BI;
      escrow.status = 'Launched';
      escrow.createdAt = ZERO_BI;

      escrow.save();

      const newFund1 = createFundEvent(operatorAddress, 1, BigInt.fromI32(10));

      handleFund(newFund1);

      assert.fieldEquals(
        'EscrowStatistics',
        STATISTICS_ENTITY_ID.toHex(),
        'fundEventCount',
        '1'
      );

      [
        'storeResultsEventCount',
        'bulkPayoutEventCount',
        'pendingStatusEventCount',
        'cancelledStatusEventCount',
        'partialStatusEventCount',
        'paidStatusEventCount',
        'completedStatusEventCount',
      ].forEach((field) => {
        assert.fieldEquals(
          'EscrowStatistics',
          STATISTICS_ENTITY_ID.toHex(),
          field,
          '0'
        );
      });

      assert.fieldEquals(
        'EscrowStatistics',
        STATISTICS_ENTITY_ID.toHex(),
        'totalEventCount',
        '1'
      );
    });
  });
});
