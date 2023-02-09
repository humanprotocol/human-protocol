import { BigInt } from '@graphprotocol/graph-ts';
import { Launched } from '../../generated/EscrowFactory/EscrowFactory';
import { EscrowStatistics, LaunchedEscrow } from '../../generated/schema';
import { Escrow } from '../../generated/templates';
import { constructStatsEntity, STATISTICS_ENTITY_ID } from './Escrow';
import { updateEscrowAmountDayData } from './utils/dayUpdates';

export function handleLaunched(event: Launched): void {
  // Entities only exist after they have been saved to the store;
  const entity = new LaunchedEscrow(event.params.escrow.toHex());

  // Entity fields can be set based on event parameters
  entity.token = event.params.token;
  entity.from = event.transaction.from;
  entity.timestamp = event.block.timestamp;

  let statsEntity = EscrowStatistics.load(STATISTICS_ENTITY_ID);
  if (!statsEntity) {
    statsEntity = constructStatsEntity();
  }
  entity.count = statsEntity.totalEscrowCount + BigInt.fromI32(1);
  statsEntity.totalEscrowCount += BigInt.fromI32(1);

  statsEntity.save();

  // Entities can be written to the store with `.save()`
  entity.save();
  Escrow.create(event.params.escrow);

  updateEscrowAmountDayData(event);
}
