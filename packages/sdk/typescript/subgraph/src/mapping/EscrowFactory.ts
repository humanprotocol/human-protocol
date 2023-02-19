import { BigInt } from '@graphprotocol/graph-ts';
import { Launched } from '../../generated/EscrowFactory/EscrowFactory';
import { EscrowStatistics, LaunchedEscrow } from '../../generated/schema';
import { Escrow } from '../../generated/templates';
import { constructStatsEntity, STATISTICS_ENTITY_ID } from './Escrow';
import { createOrLoadLeader } from './Staking';
import { updateEscrowAmountDayData } from './utils/dayUpdates';

export function handleLaunched(event: Launched): void {
  // Entities only exist after they have been saved to the store;
  const entity = new LaunchedEscrow(event.params.escrow.toHex());

  // Entity fields can be set based on event parameters
  entity.token = event.params.token;
  entity.from = event.transaction.from;
  entity.timestamp = event.block.timestamp;
  entity.amountAllocated = BigInt.fromI32(0);
  entity.amountPayout = BigInt.fromI32(0);
  entity.status = 'Launched';

  let statsEntity = EscrowStatistics.load(STATISTICS_ENTITY_ID);
  if (!statsEntity) {
    statsEntity = constructStatsEntity();
  }
  statsEntity.totalEscrowCount = statsEntity.totalEscrowCount.plus(
    BigInt.fromI32(1)
  );
  statsEntity.save();
  entity.count = statsEntity.totalEscrowCount;

  // Entities can be written to the store with `.save()`
  entity.save();
  Escrow.create(event.params.escrow);

  updateEscrowAmountDayData(event);

  const leader = createOrLoadLeader(entity.from);

  leader.amountJobsLaunched = leader.amountJobsLaunched.plus(BigInt.fromI32(1));
  leader.save();
}
