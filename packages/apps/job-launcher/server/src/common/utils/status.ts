import { EscrowStatus } from '@human-protocol/sdk';
import { JobStatusFilter } from '../enums/job';

export function filterToEscrowStatus(
  filterStatus: JobStatusFilter,
): EscrowStatus[] {
  switch (filterStatus) {
    case JobStatusFilter.PARTIAL:
      return [EscrowStatus.Partial];
    case JobStatusFilter.COMPLETED:
      return [EscrowStatus.Complete];
    case JobStatusFilter.CANCELED:
      return [EscrowStatus.Cancelled];
    default:
      return [EscrowStatus.Launched, EscrowStatus.Pending, EscrowStatus.Paid];
  }
}
