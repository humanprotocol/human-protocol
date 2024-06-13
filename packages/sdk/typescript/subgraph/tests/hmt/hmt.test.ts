import { Address, BigInt, DataSourceContext } from '@graphprotocol/graph-ts';
import {
  describe,
  test,
  assert,
  clearStore,
  dataSourceMock,
  beforeAll,
  afterAll,
  beforeEach,
} from 'matchstick-as/assembly';

import { Escrow } from '../../generated/schema';
import { STATISTICS_ENTITY_ID } from '../../src/mapping/Escrow';
import {
  HMT_STATISTICS_ENTITY_ID,
  handleTransfer,
  handleBulkTransfer,
  handleApproval,
  handleBulkApproval,
} from '../../src/mapping/HMToken';
import { ZERO_BI } from '../../src/mapping/utils/number';
import {
  createTransferEvent,
  createBulkTransferEvent,
  createApprovalEvent,
  createBulkApprovalEvent,
} from './fixtures';

const escrowAddressString = '0xa16081f360e3847006db660bae1c6d1b2e17ec2a';
const escrowAddress = Address.fromString(escrowAddressString);
const operatorAddressString = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
const holderAddressString = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8';
const holderAddress = Address.fromString(holderAddressString);
const holder1AddressString = '0x92a2eEF7Ff696BCef98957a0189872680600a959';
const holder1Address = Address.fromString(holder1AddressString);

describe('HMToken', () => {
  beforeAll(() => {
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
    escrow.createdAt = BigInt.fromI32(0);
    escrow.status = 'Launched';

    escrow.save();
  });

  afterAll(() => {
    dataSourceMock.resetValues();
  });

  describe('Transfer', () => {
    test('Should properly handle Transfer event to Escrow', () => {
      const transfer = createTransferEvent(
        operatorAddressString,
        escrowAddressString,
        1,
        BigInt.fromI32(10)
      );

      handleTransfer(transfer);

      const id = `${transfer.transaction.hash.toHex()}-${transfer.logIndex.toString()}-${
        transfer.block.timestamp
      }`;

      // HMTTransferEvent
      assert.fieldEquals(
        'HMTTransferEvent',
        id,
        'block',
        transfer.block.number.toString()
      );
      assert.fieldEquals(
        'HMTTransferEvent',
        id,
        'timestamp',
        transfer.block.timestamp.toString()
      );
      assert.fieldEquals(
        'HMTTransferEvent',
        id,
        'txHash',
        transfer.transaction.hash.toHex()
      );
      assert.fieldEquals('HMTTransferEvent', id, 'from', operatorAddressString);
      assert.fieldEquals('HMTTransferEvent', id, 'to', escrowAddressString);
      assert.fieldEquals('HMTTransferEvent', id, 'amount', '1');

      // FundEvent
      assert.fieldEquals(
        'FundEvent',
        id,
        'block',
        transfer.block.number.toString()
      );
      assert.fieldEquals(
        'FundEvent',
        id,
        'timestamp',
        transfer.block.timestamp.toString()
      );
      assert.fieldEquals(
        'FundEvent',
        id,
        'txHash',
        transfer.transaction.hash.toHex()
      );
      assert.fieldEquals('FundEvent', id, 'escrowAddress', escrowAddressString);
      assert.fieldEquals('FundEvent', id, 'sender', operatorAddressString);
      assert.fieldEquals('FundEvent', id, 'amount', '1');

      // Escrow
      assert.fieldEquals('Escrow', escrowAddressString, 'balance', '101');
      assert.fieldEquals(
        'Escrow',
        escrowAddressString,
        'totalFundedAmount',
        '101'
      );
      assert.fieldEquals(
        'Transaction',
        transfer.transaction.hash.toHex(),
        'txHash',
        transfer.transaction.hash.toHex()
      );
      assert.fieldEquals(
        'Transaction',
        transfer.transaction.hash.toHex(),
        'method',
        'fund'
      );
      assert.fieldEquals(
        'Transaction',
        transfer.transaction.hash.toHex(),
        'block',
        transfer.block.number.toString()
      );
      assert.fieldEquals(
        'Transaction',
        transfer.transaction.hash.toHex(),
        'from',
        transfer.transaction.from.toHex()
      );
      assert.fieldEquals(
        'Transaction',
        transfer.transaction.hash.toHex(),
        'to',
        escrowAddressString
      );
      assert.fieldEquals(
        'Transaction',
        transfer.transaction.hash.toHex(),
        'value',
        '1'
      );
    });

    test('Should properly handle Transfer event to Holder', () => {
      const transfer = createTransferEvent(
        operatorAddressString,
        holderAddressString,
        1,
        BigInt.fromI32(20)
      );

      handleTransfer(transfer);

      const id = `${transfer.transaction.hash.toHex()}-${transfer.logIndex.toString()}-${
        transfer.block.timestamp
      }`;

      // HMTTransferEvent
      assert.fieldEquals(
        'HMTTransferEvent',
        id,
        'block',
        transfer.block.number.toString()
      );
      assert.fieldEquals(
        'HMTTransferEvent',
        id,
        'timestamp',
        transfer.block.timestamp.toString()
      );
      assert.fieldEquals(
        'HMTTransferEvent',
        id,
        'txHash',
        transfer.transaction.hash.toHex()
      );
      assert.fieldEquals('HMTTransferEvent', id, 'from', operatorAddressString);
      assert.fieldEquals('HMTTransferEvent', id, 'to', holderAddressString);
      assert.fieldEquals('HMTTransferEvent', id, 'amount', '1');

      // No FundEvent
      assert.notInStore('FundEvent', id);

      // Holder
      assert.fieldEquals(
        'Holder',
        holderAddressString,
        'address',
        holderAddressString
      );
      assert.fieldEquals('Holder', holderAddressString, 'balance', '1');
    });

    test('Should properly handle Transfer event from Escrow', () => {
      const transfer = createTransferEvent(
        escrowAddressString,
        operatorAddressString,
        1,
        BigInt.fromI32(10)
      );

      handleTransfer(transfer);

      const id = `${transfer.transaction.hash.toHex()}-${transfer.logIndex.toString()}-${
        transfer.block.timestamp
      }`;

      // HMTTransferEvent
      assert.fieldEquals(
        'HMTTransferEvent',
        id,
        'block',
        transfer.block.number.toString()
      );
      assert.fieldEquals(
        'HMTTransferEvent',
        id,
        'timestamp',
        transfer.block.timestamp.toString()
      );
      assert.fieldEquals(
        'HMTTransferEvent',
        id,
        'txHash',
        transfer.transaction.hash.toHex()
      );
      assert.fieldEquals('HMTTransferEvent', id, 'from', escrowAddressString);
      assert.fieldEquals('HMTTransferEvent', id, 'to', operatorAddressString);
      assert.fieldEquals('HMTTransferEvent', id, 'amount', '1');

      // Escrow
      assert.fieldEquals('Escrow', escrowAddressString, 'balance', '100');
      assert.fieldEquals('Escrow', escrowAddressString, 'amountPaid', '1');

      // Worker
      assert.fieldEquals(
        'Worker',
        operatorAddressString,
        'totalAmountReceived',
        '1'
      );
      assert.fieldEquals('Worker', operatorAddressString, 'payoutCount', '1');

      // Payout
      const payoutId = `${transfer.transaction.hash.toHex()}-${operatorAddressString}`;
      assert.fieldEquals(
        'Payout',
        payoutId,
        'escrowAddress',
        escrowAddressString
      );
      assert.fieldEquals(
        'Payout',
        payoutId,
        'recipient',
        operatorAddressString
      );
      assert.fieldEquals('Payout', payoutId, 'amount', '1');
      assert.fieldEquals(
        'Transaction',
        transfer.transaction.hash.toHex(),
        'txHash',
        transfer.transaction.hash.toHex()
      );
      assert.fieldEquals(
        'Transaction',
        transfer.transaction.hash.toHex(),
        'method',
        'transfer'
      );
      assert.fieldEquals(
        'Transaction',
        transfer.transaction.hash.toHex(),
        'block',
        transfer.block.number.toString()
      );
      assert.fieldEquals(
        'Transaction',
        transfer.transaction.hash.toHex(),
        'from',
        transfer.transaction.from.toHex()
      );
      assert.fieldEquals(
        'Transaction',
        transfer.transaction.hash.toHex(),
        'to',
        operatorAddressString
      );
      assert.fieldEquals(
        'Transaction',
        transfer.transaction.hash.toHex(),
        'value',
        '1'
      );
    });
  });

  test('Should properly handle BulkTransfer event', () => {
    const bulkTransfer = createBulkTransferEvent(1, 3, BigInt.fromI32(10));

    handleBulkTransfer(bulkTransfer);

    const id = `${bulkTransfer.transaction.hash.toHex()}-${bulkTransfer.logIndex.toString()}-${
      bulkTransfer.block.timestamp
    }`;

    // HMTBulkTransferEvent
    assert.fieldEquals(
      'HMTBulkTransferEvent',
      id,
      'block',
      bulkTransfer.block.number.toString()
    );
    assert.fieldEquals(
      'HMTBulkTransferEvent',
      id,
      'timestamp',
      bulkTransfer.block.timestamp.toString()
    );
    assert.fieldEquals(
      'HMTBulkTransferEvent',
      id,
      'txHash',
      bulkTransfer.transaction.hash.toHex()
    );
    assert.fieldEquals('HMTBulkTransferEvent', id, 'txId', '1');
    assert.fieldEquals('HMTBulkTransferEvent', id, 'bulkCount', '3');
    assert.fieldEquals(
      'Transaction',
      bulkTransfer.transaction.hash.toHex(),
      'txHash',
      bulkTransfer.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'Transaction',
      bulkTransfer.transaction.hash.toHex(),
      'method',
      'transferBulk'
    );
    assert.fieldEquals(
      'Transaction',
      bulkTransfer.transaction.hash.toHex(),
      'block',
      bulkTransfer.block.number.toString()
    );
    assert.fieldEquals(
      'Transaction',
      bulkTransfer.transaction.hash.toHex(),
      'from',
      bulkTransfer.transaction.from.toHex()
    );
  });

  test('Should properly handle Approval event', () => {
    const approval = createApprovalEvent(
      holderAddressString,
      operatorAddressString,
      1,
      BigInt.fromI32(10)
    );

    handleApproval(approval);

    const id = `${approval.transaction.hash.toHex()}-${approval.logIndex.toString()}-${
      approval.block.timestamp
    }`;

    // HMTApprovalEvent
    assert.fieldEquals(
      'HMTApprovalEvent',
      id,
      'block',
      approval.block.number.toString()
    );
    assert.fieldEquals(
      'HMTApprovalEvent',
      id,
      'timestamp',
      approval.block.timestamp.toString()
    );
    assert.fieldEquals(
      'HMTApprovalEvent',
      id,
      'txHash',
      approval.transaction.hash.toHex()
    );
    assert.fieldEquals('HMTApprovalEvent', id, 'owner', holderAddressString);
    assert.fieldEquals(
      'HMTApprovalEvent',
      id,
      'spender',
      operatorAddressString
    );
    assert.fieldEquals('HMTApprovalEvent', id, 'amount', '1');
    assert.fieldEquals(
      'Transaction',
      approval.transaction.hash.toHex(),
      'txHash',
      approval.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'Transaction',
      approval.transaction.hash.toHex(),
      'method',
      'approve'
    );
    assert.fieldEquals(
      'Transaction',
      approval.transaction.hash.toHex(),
      'block',
      approval.block.number.toString()
    );
    assert.fieldEquals(
      'Transaction',
      approval.transaction.hash.toHex(),
      'from',
      approval.transaction.from.toHex()
    );
    assert.fieldEquals(
      'Transaction',
      approval.transaction.hash.toHex(),
      'to',
      operatorAddressString
    );
    assert.fieldEquals(
      'Transaction',
      approval.transaction.hash.toHex(),
      'value',
      '1'
    );
  });

  test('Should properly handle BulkApproval event', () => {
    const bulkApproval = createBulkApprovalEvent(1, 3, BigInt.fromI32(10));

    handleBulkApproval(bulkApproval);

    const id = `${bulkApproval.transaction.hash.toHex()}-${bulkApproval.logIndex.toString()}-${
      bulkApproval.block.timestamp
    }`;

    // HMTBulkApprovalEvent
    assert.fieldEquals(
      'HMTBulkApprovalEvent',
      id,
      'block',
      bulkApproval.block.number.toString()
    );
    assert.fieldEquals(
      'HMTBulkApprovalEvent',
      id,
      'timestamp',
      bulkApproval.block.timestamp.toString()
    );
    assert.fieldEquals(
      'HMTBulkApprovalEvent',
      id,
      'txHash',
      bulkApproval.transaction.hash.toHex()
    );
    assert.fieldEquals('HMTBulkApprovalEvent', id, 'txId', '1');
    assert.fieldEquals('HMTBulkApprovalEvent', id, 'bulkCount', '3');
    assert.fieldEquals(
      'Transaction',
      bulkApproval.transaction.hash.toHex(),
      'txHash',
      bulkApproval.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'Transaction',
      bulkApproval.transaction.hash.toHex(),
      'method',
      'increaseApprovalBulk'
    );
    assert.fieldEquals(
      'Transaction',
      bulkApproval.transaction.hash.toHex(),
      'block',
      bulkApproval.block.number.toString()
    );
    assert.fieldEquals(
      'Transaction',
      bulkApproval.transaction.hash.toHex(),
      'from',
      bulkApproval.transaction.from.toHex()
    );
  });

  describe('Statistics', () => {
    beforeEach(() => {
      clearStore();
    });

    test('Should properly calculate Transfer event in statistics', () => {
      const transfer1 = createTransferEvent(
        '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
        '0x92a2eEF7Ff696BCef98957a0189872680600a959',
        1,
        BigInt.fromI32(10)
      );
      const transfer2 = createTransferEvent(
        '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
        '0x92a2eEF7Ff696BCef98957a0189872680600a959',
        2,
        BigInt.fromI32(10)
      );

      handleTransfer(transfer1);
      handleTransfer(transfer2);

      assert.fieldEquals(
        'HMTokenStatistics',
        HMT_STATISTICS_ENTITY_ID,
        'totalTransferEventCount',
        '2'
      );
      assert.fieldEquals(
        'HMTokenStatistics',
        HMT_STATISTICS_ENTITY_ID,
        'totalValueTransfered',
        '3'
      );
    });

    test('Should properly calculate holders in statistics', () => {
      const transfer1 = createTransferEvent(
        '0x0000000000000000000000000000000000000000',
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
        HMT_STATISTICS_ENTITY_ID,
        'holders',
        '1'
      );

      const transfer3 = createTransferEvent(
        '0x0000000000000000000000000000000000000000',
        holder1AddressString,
        10,
        BigInt.fromI32(10)
      );

      handleTransfer(transfer3);

      assert.fieldEquals('Holder', holderAddress.toHex(), 'balance', '10');
      assert.fieldEquals('Holder', holder1Address.toHex(), 'balance', '10');
      assert.fieldEquals(
        'HMTokenStatistics',
        HMT_STATISTICS_ENTITY_ID,
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
        HMT_STATISTICS_ENTITY_ID,
        'holders',
        '1'
      );
    });

    test('Should properly calculate BulkTransfer event in statistics', () => {
      const bulkTransfer1 = createBulkTransferEvent(1, 3, BigInt.fromI32(10));
      const bulkTransfer2 = createBulkTransferEvent(2, 3, BigInt.fromI32(10));

      handleBulkTransfer(bulkTransfer1);
      handleBulkTransfer(bulkTransfer2);

      assert.fieldEquals(
        'HMTokenStatistics',
        HMT_STATISTICS_ENTITY_ID,
        'totalBulkTransferEventCount',
        '2'
      );
    });

    test('Should properly calculate Approval event in statistics', () => {
      const approval1 = createApprovalEvent(
        '0x92a2eEF7Ff696BCef98957a0189872680600a959',
        '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
        10,
        BigInt.fromI32(10)
      );

      const approval2 = createApprovalEvent(
        '0x92a2eEF7Ff696BCef98957a0189872680600a959',
        '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
        10,
        BigInt.fromI32(10)
      );

      handleApproval(approval1);
      handleApproval(approval2);

      assert.fieldEquals(
        'HMTokenStatistics',
        HMT_STATISTICS_ENTITY_ID,
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
        HMT_STATISTICS_ENTITY_ID,
        'totalBulkApprovalEventCount',
        '2'
      );
    });

    test('Should properly calculate FundEvent in statistics, when sending to escrow', () => {
      const escrow = new Escrow(escrowAddress.toHex());
      escrow.address = escrowAddress;
      escrow.token = Address.zero();
      escrow.factoryAddress = Address.zero();
      escrow.launcher = Address.zero();
      escrow.count = ZERO_BI;
      escrow.balance = BigInt.fromI32(100);
      escrow.totalFundedAmount = BigInt.fromI32(100);
      escrow.amountPaid = ZERO_BI;
      escrow.createdAt = BigInt.fromI32(0);
      escrow.status = 'Launched';

      escrow.save();

      const transfer1 = createTransferEvent(
        operatorAddressString,
        escrowAddressString,
        1,
        BigInt.fromI32(10)
      );

      handleTransfer(transfer1);

      const transfer2 = createTransferEvent(
        operatorAddressString,
        escrowAddressString,
        1,
        BigInt.fromI32(20)
      );

      handleTransfer(transfer2);

      assert.fieldEquals(
        'EscrowStatistics',
        STATISTICS_ENTITY_ID,
        'fundEventCount',
        '2'
      );

      [
        'setupEventCount',
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
