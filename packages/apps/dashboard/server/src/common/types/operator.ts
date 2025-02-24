import { OrderDirection } from '@human-protocol/sdk';
import { OperatorsOrderBy } from '../enums/operator';

export type GetOperatorsPaginationOptions = {
  orderBy?: OperatorsOrderBy;
  orderDirection?: OrderDirection;
  first?: number;
};
