import { Address, BigInt, DataSourceContext } from '@graphprotocol/graph-ts';
import {
  describe,
  test,
  assert,
  clearStore,
  beforeAll,
  afterAll,
  dataSourceMock,
} from 'matchstick-as/assembly';

import { Escrow } from '../../generated/schema';
import {
  handleStakeDeposited,
  handleStakeLocked,
  handleStakeSlashed,
  handleStakeWithdrawn,
  handleFeeWithdrawn,
  STATISTICS_ENTITY_ID,
  TOKEN_ADDRESS,
} from '../../src/mapping/Staking';
import { toEventId } from '../../src/mapping/utils/event';
import { ZERO_BI } from '../../src/mapping/utils/number';
import {
  createFeeWithdrawnEvent,
  createStakeDepositedEvent,
  createStakeLockedEvent,
  createStakeSlashedEvent,
  createStakeWithdrawnEvent,
} from './fixtures';

const stakingAddressString = '0xa16081f360e3847006db660bae1c6d1b2e17ffaa';
const escrow1AddressString = '0xD979105297fB0eee83F7433fC09279cb5B94fFC7';
const escrow1Address = Address.fromString(escrow1AddressString);
const escrow2AddressString = '0x92a2eEF7Ff696BCef98957a0189872680600a95A';
const escrow2Address = Address.fromString(escrow2AddressString);

describe('Staking', () => {
  beforeAll(() => {
    dataSourceMock.setReturnValues(
      stakingAddressString,
      'rinkeby',
      new DataSourceContext()
    );
    const escrow1 = new Escrow(escrow1Address);
    escrow1.address = escrow1Address;
    escrow1.token = Address.zero();
    escrow1.factoryAddress = Address.zero();
    escrow1.launcher = Address.zero();
    escrow1.canceler = Address.zero();
    escrow1.count = ZERO_BI;
    escrow1.balance = ZERO_BI;
    escrow1.totalFundedAmount = ZERO_BI;
    escrow1.amountPaid = ZERO_BI;
    escrow1.status = 'Launched';
    escrow1.createdAt = BigInt.fromI32(0);
    escrow1.save();

    const escrow2 = new Escrow(escrow2Address);
    escrow2.address = escrow2Address;
    escrow2.token = Address.zero();
    escrow2.factoryAddress = Address.zero();
    escrow2.launcher = Address.zero();
    escrow2.canceler = Address.zero();
    escrow2.count = ZERO_BI;
    escrow2.balance = ZERO_BI;
    escrow2.totalFundedAmount = ZERO_BI;
    escrow2.amountPaid = ZERO_BI;
    escrow2.status = 'Launched';
    escrow2.createdAt = BigInt.fromI32(0);
    escrow2.save();
  });

  afterAll(() => {
    clearStore();
  });

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

    const id1 = toEventId(data1).toHex();
    const id2 = toEventId(data2).toHex();

    // Data 1
    assert.fieldEquals(
      'StakeDepositedEvent',
      id1,
      'block',
      data1.block.number.toString()
    );
    assert.fieldEquals(
      'StakeDepositedEvent',
      id1,
      'timestamp',
      data1.block.timestamp.toString()
    );
    assert.fieldEquals(
      'StakeDepositedEvent',
      id1,
      'txHash',
      data1.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'StakeDepositedEvent',
      id1,
      'staker',
      data1.params.staker.toHex()
    );
    assert.fieldEquals('StakeDepositedEvent', id1, 'amount', '100');

    // Data 2
    assert.fieldEquals(
      'StakeDepositedEvent',
      id2,
      'block',
      data2.block.number.toString()
    );
    assert.fieldEquals(
      'StakeDepositedEvent',
      id2,
      'timestamp',
      data2.block.timestamp.toString()
    );
    assert.fieldEquals(
      'StakeDepositedEvent',
      id2,
      'txHash',
      data2.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'StakeDepositedEvent',
      id2,
      'staker',
      data2.params.staker.toHex()
    );
    assert.fieldEquals('StakeDepositedEvent', id2, 'amount', '200');

    // Operator statistics
    assert.fieldEquals(
      'OperatorStatistics',
      STATISTICS_ENTITY_ID.toHex(),
      'operators',
      '2'
    );

    // Operator
    assert.fieldEquals(
      'Operator',
      data1.params.staker.toHex(),
      'amountStaked',
      '100'
    );
    assert.fieldEquals(
      'Operator',
      data2.params.staker.toHex(),
      'amountStaked',
      '200'
    );

    // Transaction
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
      'stake'
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
    assert.fieldEquals(
      'Transaction',
      data2.transaction.hash.toHex(),
      'value',
      '200'
    );
    assert.fieldEquals(
      'Transaction',
      data2.transaction.hash.toHex(),
      'token',
      TOKEN_ADDRESS.toHexString()
    );
  });

  test('Should properly index StakeLocked events', () => {
    const data1 = createStakeLockedEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      50,
      30,
      BigInt.fromI32(20)
    );
    const data2 = createStakeLockedEvent(
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      100,
      31,
      BigInt.fromI32(21)
    );

    handleStakeLocked(data1);
    handleStakeLocked(data2);

    const id1 = toEventId(data1).toHex();
    const id2 = toEventId(data2).toHex();

    // Data 1
    assert.fieldEquals(
      'StakeLockedEvent',
      id1,
      'block',
      data1.block.number.toString()
    );
    assert.fieldEquals(
      'StakeLockedEvent',
      id1,
      'timestamp',
      data1.block.timestamp.toString()
    );
    assert.fieldEquals(
      'StakeLockedEvent',
      id1,
      'txHash',
      data1.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'StakeLockedEvent',
      id1,
      'staker',
      data1.params.staker.toHex()
    );
    assert.fieldEquals('StakeLockedEvent', id1, 'amount', '50');
    assert.fieldEquals('StakeLockedEvent', id1, 'lockedUntilTimestamp', '30');

    // Data 2
    assert.fieldEquals(
      'StakeLockedEvent',
      id2,
      'block',
      data2.block.number.toString()
    );
    assert.fieldEquals(
      'StakeLockedEvent',
      id2,
      'timestamp',
      data2.block.timestamp.toString()
    );
    assert.fieldEquals(
      'StakeLockedEvent',
      id2,
      'txHash',
      data2.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'StakeLockedEvent',
      id2,
      'staker',
      data2.params.staker.toHex()
    );
    assert.fieldEquals('StakeLockedEvent', id2, 'amount', '100');
    assert.fieldEquals('StakeLockedEvent', id2, 'lockedUntilTimestamp', '31');

    // Operator statistics
    assert.fieldEquals(
      'OperatorStatistics',
      STATISTICS_ENTITY_ID.toHex(),
      'operators',
      '2'
    );

    // Operator
    assert.fieldEquals(
      'Operator',
      data1.params.staker.toHex(),
      'amountStaked',
      '100'
    );
    assert.fieldEquals(
      'Operator',
      data1.params.staker.toHex(),
      'amountLocked',
      '50'
    );
    assert.fieldEquals(
      'Operator',
      data1.params.staker.toHex(),
      'lockedUntilTimestamp',
      '30'
    );

    assert.fieldEquals(
      'Operator',
      data2.params.staker.toHex(),
      'amountStaked',
      '200'
    );
    assert.fieldEquals(
      'Operator',
      data2.params.staker.toHex(),
      'amountLocked',
      '100'
    );
    assert.fieldEquals(
      'Operator',
      data2.params.staker.toHex(),
      'lockedUntilTimestamp',
      '31'
    );

    // Transaction
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
      'unstake'
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
    assert.fieldEquals(
      'Transaction',
      data2.transaction.hash.toHex(),
      'value',
      '100'
    );
    assert.fieldEquals(
      'Transaction',
      data2.transaction.hash.toHex(),
      'token',
      TOKEN_ADDRESS.toHexString()
    );
  });

  test('Should properly index StakeWithdrawn events', () => {
    const data1 = createStakeWithdrawnEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      30,
      BigInt.fromI32(40)
    );
    const data2 = createStakeWithdrawnEvent(
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      100,
      BigInt.fromI32(41)
    );

    handleStakeWithdrawn(data1);
    handleStakeWithdrawn(data2);

    const id1 = toEventId(data1).toHex();
    const id2 = toEventId(data2).toHex();

    // Data 1
    assert.fieldEquals(
      'StakeWithdrawnEvent',
      id1,
      'block',
      data1.block.number.toString()
    );
    assert.fieldEquals(
      'StakeWithdrawnEvent',
      id1,
      'timestamp',
      data1.block.timestamp.toString()
    );
    assert.fieldEquals(
      'StakeWithdrawnEvent',
      id1,
      'txHash',
      data1.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'StakeWithdrawnEvent',
      id1,
      'staker',
      data1.params.staker.toHex()
    );
    assert.fieldEquals('StakeWithdrawnEvent', id1, 'amount', '30');

    // Data 2
    assert.fieldEquals(
      'StakeWithdrawnEvent',
      id2,
      'block',
      data2.block.number.toString()
    );
    assert.fieldEquals(
      'StakeWithdrawnEvent',
      id2,
      'timestamp',
      data2.block.timestamp.toString()
    );
    assert.fieldEquals(
      'StakeWithdrawnEvent',
      id2,
      'txHash',
      data2.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'StakeWithdrawnEvent',
      id2,
      'staker',
      data2.params.staker.toHex()
    );
    assert.fieldEquals('StakeWithdrawnEvent', id2, 'amount', '100');

    // Operator statistics
    assert.fieldEquals(
      'OperatorStatistics',
      STATISTICS_ENTITY_ID.toHex(),
      'operators',
      '2'
    );

    // Operator
    assert.fieldEquals(
      'Operator',
      data1.params.staker.toHex(),
      'amountStaked',
      '70'
    );
    assert.fieldEquals(
      'Operator',
      data1.params.staker.toHex(),
      'amountLocked',
      '20'
    );
    assert.fieldEquals(
      'Operator',
      data1.params.staker.toHex(),
      'lockedUntilTimestamp',
      '30'
    );
    assert.fieldEquals(
      'Operator',
      data1.params.staker.toHex(),
      'amountWithdrawn',
      '30'
    );

    assert.fieldEquals(
      'Operator',
      data2.params.staker.toHex(),
      'amountStaked',
      '100'
    );
    assert.fieldEquals(
      'Operator',
      data2.params.staker.toHex(),
      'amountLocked',
      '0'
    );
    assert.fieldEquals(
      'Operator',
      data2.params.staker.toHex(),
      'lockedUntilTimestamp',
      '0'
    );
    assert.fieldEquals(
      'Operator',
      data2.params.staker.toHex(),
      'amountWithdrawn',
      '100'
    );

    // Transaction
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
      'stakeWithdrawn'
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
    assert.fieldEquals(
      'Transaction',
      data2.transaction.hash.toHex(),
      'value',
      '100'
    );
    assert.fieldEquals(
      'Transaction',
      data2.transaction.hash.toHex(),
      'token',
      TOKEN_ADDRESS.toHexString()
    );
  });

  test('Should properly index StakeSlashed events', () => {
    const data1 = createStakeSlashedEvent(
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC6',
      10,
      escrow1AddressString,
      '0xD979105297fB0eee83F7433fC09279cb5B94fFC8',
      BigInt.fromI32(60)
    );
    const data2 = createStakeSlashedEvent(
      '0x92a2eEF7Ff696BCef98957a0189872680600a959',
      10,
      escrow2AddressString,
      '0x92a2eEF7Ff696BCef98957a0189872680600a95B',
      BigInt.fromI32(61)
    );

    handleStakeSlashed(data1);
    handleStakeSlashed(data2);

    const id1 = toEventId(data1).toHex();
    const id2 = toEventId(data2).toHex();

    // Data 1
    assert.fieldEquals(
      'StakeSlashedEvent',
      id1,
      'block',
      data1.block.number.toString()
    );
    assert.fieldEquals(
      'StakeSlashedEvent',
      id1,
      'timestamp',
      data1.block.timestamp.toString()
    );
    assert.fieldEquals(
      'StakeSlashedEvent',
      id1,
      'txHash',
      data1.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'StakeSlashedEvent',
      id1,
      'staker',
      data1.params.staker.toHex()
    );
    assert.fieldEquals('StakeSlashedEvent', id1, 'amount', '10');
    assert.fieldEquals(
      'StakeSlashedEvent',
      id1,
      'escrowAddress',
      data1.params.escrowAddress.toHex()
    );
    assert.fieldEquals(
      'StakeSlashedEvent',
      id1,
      'slashRequester',
      data1.params.slashRequester.toHex()
    );

    // Data 2
    assert.fieldEquals(
      'StakeSlashedEvent',
      id2,
      'block',
      data2.block.number.toString()
    );
    assert.fieldEquals(
      'StakeSlashedEvent',
      id2,
      'timestamp',
      data2.block.timestamp.toString()
    );
    assert.fieldEquals(
      'StakeSlashedEvent',
      id2,
      'txHash',
      data2.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'StakeSlashedEvent',
      id2,
      'staker',
      data2.params.staker.toHex()
    );
    assert.fieldEquals('StakeSlashedEvent', id2, 'amount', '10');
    assert.fieldEquals(
      'StakeSlashedEvent',
      id2,
      'escrowAddress',
      data2.params.escrowAddress.toHex()
    );
    assert.fieldEquals(
      'StakeSlashedEvent',
      id2,
      'slashRequester',
      data2.params.slashRequester.toHex()
    );

    // Operator statistics
    assert.fieldEquals(
      'OperatorStatistics',
      STATISTICS_ENTITY_ID.toHex(),
      'operators',
      '2'
    );

    // Operator
    assert.fieldEquals(
      'Operator',
      data1.params.staker.toHex(),
      'amountStaked',
      '60'
    );
    assert.fieldEquals(
      'Operator',
      data1.params.staker.toHex(),
      'amountLocked',
      '20'
    );
    assert.fieldEquals(
      'Operator',
      data1.params.staker.toHex(),
      'lockedUntilTimestamp',
      '30'
    );
    assert.fieldEquals(
      'Operator',
      data1.params.staker.toHex(),
      'amountWithdrawn',
      '30'
    );
    assert.fieldEquals(
      'Operator',
      data1.params.staker.toHex(),
      'amountSlashed',
      '10'
    );

    assert.fieldEquals(
      'Operator',
      data2.params.staker.toHex(),
      'amountStaked',
      '90'
    );
    assert.fieldEquals(
      'Operator',
      data2.params.staker.toHex(),
      'amountLocked',
      '0'
    );
    assert.fieldEquals(
      'Operator',
      data2.params.staker.toHex(),
      'lockedUntilTimestamp',
      '0'
    );
    assert.fieldEquals(
      'Operator',
      data2.params.staker.toHex(),
      'amountWithdrawn',
      '100'
    );
    assert.fieldEquals(
      'Operator',
      data2.params.staker.toHex(),
      'amountSlashed',
      '10'
    );

    // Transaction
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
      'slash'
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
    assert.fieldEquals(
      'Transaction',
      data2.transaction.hash.toHex(),
      'value',
      '10'
    );
    assert.fieldEquals(
      'Transaction',
      data2.transaction.hash.toHex(),
      'token',
      TOKEN_ADDRESS.toHexString()
    );
    assert.fieldEquals(
      'Transaction',
      data2.transaction.hash.toHex(),
      'escrow',
      escrow2Address.toHexString()
    );
  });

  test('Should properly create transactions for FeeWithdrawn events', () => {
    const data = createFeeWithdrawnEvent(10, BigInt.fromI32(60));

    handleFeeWithdrawn(data);

    // Transaction
    assert.fieldEquals(
      'Transaction',
      data.transaction.hash.toHex(),
      'txHash',
      data.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'Transaction',
      data.transaction.hash.toHex(),
      'method',
      'withdrawFees'
    );
    assert.fieldEquals(
      'Transaction',
      data.transaction.hash.toHex(),
      'block',
      data.block.number.toString()
    );
    assert.fieldEquals(
      'Transaction',
      data.transaction.hash.toHex(),
      'to',
      stakingAddressString
    );
    assert.fieldEquals(
      'Transaction',
      data.transaction.hash.toHex(),
      'value',
      '10'
    );
    assert.fieldEquals(
      'Transaction',
      data.transaction.hash.toHex(),
      'token',
      TOKEN_ADDRESS.toHexString()
    );
  });
});
