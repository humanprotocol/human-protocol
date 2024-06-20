import {
  Launched,
  LaunchedV2,
} from '../../generated/EscrowFactory/EscrowFactory';
import { Escrow, EscrowStatusEvent } from '../../generated/schema';
import { Escrow as EscrowTemplate } from '../../generated/templates';
import { createOrLoadEscrowStatistics } from './Escrow';
import { createOrLoadLeader } from './Staking';
import { createTransaction } from './utils/transaction';
import { getEventDayData } from './utils/dayUpdates';
import { toEventId } from './utils/event';
import { ONE_BI, ZERO_BI } from './utils/number';

export function handleLaunched(event: Launched): void {
  createTransaction(event, 'createEscrow');
  // Create LaunchedStatusEvent entity
  const statusEventEntity = new EscrowStatusEvent(toEventId(event));
  statusEventEntity.block = event.block.number;
  statusEventEntity.timestamp = event.block.timestamp;
  statusEventEntity.txHash = event.transaction.hash;
  statusEventEntity.escrowAddress = event.params.escrow;
  statusEventEntity.sender = event.transaction.from;
  statusEventEntity.launcher = event.transaction.from;
  statusEventEntity.status = 'Launched';
  statusEventEntity.save();

  // Create Escrow entity
  const entity = new Escrow(event.params.escrow.toHex());

  entity.createdAt = event.block.timestamp;
  entity.address = event.params.escrow;
  entity.token = event.params.token;
  entity.factoryAddress = event.address;
  entity.launcher = event.transaction.from;

  entity.balance = ZERO_BI;
  entity.amountPaid = ZERO_BI;
  entity.totalFundedAmount = ZERO_BI;

  entity.status = 'Launched';

  // Update escrow statistics
  const statsEntity = createOrLoadEscrowStatistics();
  statsEntity.totalEscrowCount = statsEntity.totalEscrowCount.plus(ONE_BI);
  statsEntity.save();

  entity.count = statsEntity.totalEscrowCount;
  entity.save();

  // Create escrow template
  EscrowTemplate.create(event.params.escrow);

  // Update escrow amount day data
  const eventDayData = getEventDayData(event);
  eventDayData.dailyEscrowCount = eventDayData.dailyEscrowCount.plus(ONE_BI);
  eventDayData.save();

  // Increase amount of jobs launched by leader
  const leader = createOrLoadLeader(event.transaction.from);
  leader.amountJobsLaunched = leader.amountJobsLaunched.plus(ONE_BI);
  leader.save();
}

export function handleLaunchedV2(event: LaunchedV2): void {
  createTransaction(event, 'createEscrow');
  // Create Escrow entity
  const entity = new Escrow(event.params.escrow.toHex());

  entity.createdAt = event.block.timestamp;
  entity.address = event.params.escrow;
  entity.token = event.params.token;
  entity.jobRequesterId = event.params.jobRequesterId;
  entity.factoryAddress = event.address;
  entity.launcher = event.transaction.from;

  entity.balance = ZERO_BI;
  entity.amountPaid = ZERO_BI;
  entity.totalFundedAmount = ZERO_BI;

  entity.status = 'Launched';

  // Update escrow statistics
  const statsEntity = createOrLoadEscrowStatistics();
  statsEntity.totalEscrowCount = statsEntity.totalEscrowCount.plus(ONE_BI);
  statsEntity.save();

  entity.count = statsEntity.totalEscrowCount;
  entity.save();

  // Create escrow template
  EscrowTemplate.create(event.params.escrow);

  // Update escrow amount day data
  const eventDayData = getEventDayData(event);
  eventDayData.dailyEscrowCount = eventDayData.dailyEscrowCount.plus(ONE_BI);
  eventDayData.save();

  // Increase amount of jobs launched by leader
  const leader = createOrLoadLeader(event.transaction.from);
  leader.amountJobsLaunched = leader.amountJobsLaunched.plus(ONE_BI);
  leader.save();
}
