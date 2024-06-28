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
} from '../../src/mapping/Escrow';
import { ZERO_BI } from '../../src/mapping/utils/number';
import {
  createISEvent,
  createPendingEvent,
  createBulkTransferEvent,
  createCancelledEvent,
  createCompletedEvent,
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

  test('Should properly handle Pending event for old contract', () => {
    const URL = 'test.com';
    const HASH = 'is_hash_1';

    createMockedFunction(
      escrowAddress,
      'reputationOracleStake',
      'reputationOracleStake():(uint256)'
    ).returns([ethereum.Value.fromI32(10)]);
    createMockedFunction(
      escrowAddress,
      'reputationOracleFeePercentage',
      'reputationOracleFeePercentage():(uint8)'
    ).reverts();

    createMockedFunction(
      escrowAddress,
      'recordingOracleStake',
      'recordingOracleStake():(uint256)'
    ).returns([ethereum.Value.fromI32(20)]);
    createMockedFunction(
      escrowAddress,
      'recordingOracleFeePercentage',
      'recordingOracleFeePercentage():(uint8)'
    ).reverts();

    createMockedFunction(
      escrowAddress,
      'exchangeOracle',
      'exchangeOracle():(address)'
    ).reverts();
    createMockedFunction(
      escrowAddress,
      'exchangeOracleFeePercentage',
      'exchangeOracleFeePercentage():(uint8)'
    ).reverts();

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
      'reputationOracleFee',
      '10'
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
      'recordingOracleFee',
      '20'
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

  test('Should properly handle Pending event for new contract, without exchange oracle', () => {
    const URL = 'test.com';
    const HASH = 'is_hash_1';

    createMockedFunction(
      escrowAddress,
      'reputationOracleStake',
      'reputationOracleStake():(uint256)'
    ).reverts();
    createMockedFunction(
      escrowAddress,
      'reputationOracleFeePercentage',
      'reputationOracleFeePercentage():(uint8)'
    ).returns([ethereum.Value.fromI32(10)]);
    createMockedFunction(
      escrowAddress,
      'recordingOracleStake',
      'recordingOracleStake():(uint256)'
    ).reverts();
    createMockedFunction(
      escrowAddress,
      'recordingOracleFeePercentage',
      'recordingOracleFeePercentage():(uint8)'
    ).returns([ethereum.Value.fromI32(20)]);

    createMockedFunction(
      escrowAddress,
      'exchangeOracle',
      'exchangeOracle():(address)'
    ).reverts();
    createMockedFunction(
      escrowAddress,
      'exchangeOracleFeePercentage',
      'exchangeOracleFeePercentage():(uint8)'
    ).reverts();

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
      'reputationOracleFee',
      '10'
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
      'recordingOracleFee',
      '20'
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

  test('Should properly handle Pending event for new contract, with exchange oracle', () => {
    const URL = 'test.com';
    const HASH = 'is_hash_1';

    createMockedFunction(
      escrowAddress,
      'reputationOracleStake',
      'reputationOracleStake():(uint256)'
    ).reverts();
    createMockedFunction(
      escrowAddress,
      'reputationOracleFeePercentage',
      'reputationOracleFeePercentage():(uint8)'
    ).returns([ethereum.Value.fromI32(10)]);
    createMockedFunction(
      escrowAddress,
      'recordingOracleStake',
      'recordingOracleStake():(uint256)'
    ).reverts();
    createMockedFunction(
      escrowAddress,
      'recordingOracleFeePercentage',
      'recordingOracleFeePercentage():(uint8)'
    ).returns([ethereum.Value.fromI32(20)]);

    createMockedFunction(
      escrowAddress,
      'exchangeOracle',
      'exchangeOracle():(address)'
    ).returns([ethereum.Value.fromAddress(exchangeOracleAddress)]);
    createMockedFunction(
      escrowAddress,
      'exchangeOracleFeePercentage',
      'exchangeOracleFeePercentage():(uint8)'
    ).returns([ethereum.Value.fromI32(30)]);

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
      'reputationOracleFee',
      '10'
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
      'recordingOracleFee',
      '20'
    );
    assert.fieldEquals(
      'Escrow',
      escrowAddress.toHex(),
      'exchangeOracle',
      exchangeOracleAddressString
    );
    assert.fieldEquals(
      'Escrow',
      escrowAddress.toHex(),
      'exchangeOracleFee',
      '30'
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
    const bulk2 = createBulkTransferEvent(
      operatorAddress,
      3,
      [workerAddress, workerAddress, workerAddress, worker2Address],
      [1, 1, 1, 95],
      false,
      BigInt.fromI32(11)
    );

    handleBulkTransfer(bulk2);

    const id2 = `${bulk2.transaction.hash.toHex()}-${bulk2.logIndex.toString()}-${
      bulk2.block.timestamp
    }`;

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

    const id = `${newCancelled.transaction.hash.toHex()}-${newCancelled.logIndex.toString()}-${
      newCancelled.block.timestamp
    }`;

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

    const id = `${newCompleted.transaction.hash.toHex()}-${newCompleted.logIndex.toString()}-${
      newCompleted.block.timestamp
    }`;

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
      handleBulkTransfer(
        createBulkTransferEvent(
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
          BigInt.fromI32(11)
        )
      );
      handleBulkTransfer(
        createBulkTransferEvent(
          operatorAddress,
          2,
          [workerAddress, workerAddress, workerAddress, workerAddress],
          [1, 1, 1, 1],
          false,
          BigInt.fromI32(11)
        )
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

    test('Should properly calculate cancelled event in statstics', () => {
      const newCancelled1 = createCancelledEvent(operatorAddress);
      const newCancelled2 = createCancelledEvent(operatorAddress);

      handleCancelled(newCancelled1);
      handleCancelled(newCancelled2);

      assert.fieldEquals(
        'EscrowStatistics',
        STATISTICS_ENTITY_ID,
        'cancelledStatusEventCount',
        '2'
      );

      [
        'fundEventCount',
        'setupEventCount',
        'storeResultsEventCount',
        'bulkPayoutEventCount',
        'pendingStatusEventCount',
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

    test('Should properly calculate completed event in statstics', () => {
      const newCompleted1 = createCompletedEvent(operatorAddress);
      const newCompleted2 = createCompletedEvent(operatorAddress);

      handleCompleted(newCompleted1);
      handleCompleted(newCompleted2);

      assert.fieldEquals(
        'EscrowStatistics',
        STATISTICS_ENTITY_ID,
        'completedStatusEventCount',
        '2'
      );

      [
        'fundEventCount',
        'setupEventCount',
        'storeResultsEventCount',
        'bulkPayoutEventCount',
        'pendingStatusEventCount',
        'cancelledStatusEventCount',
        'partialStatusEventCount',
        'paidStatusEventCount',
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
  });
});
