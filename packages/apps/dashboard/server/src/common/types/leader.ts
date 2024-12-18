import { OrderDirection } from '@human-protocol/sdk';
import { LeadersOrderBy } from '../enums/leader';

export type GetLeadersPaginationOptions = {
  orderBy?: LeadersOrderBy;
  orderDirection?: OrderDirection;
  first?: number;
};
