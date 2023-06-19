import { EscrowStatus } from './types';

export const RAW_REWARDS_QUERY = (slasherAddress: string) => `{
    rewardAddedEvents(id: "${slasherAddress}") {
      escrow,
      amount
    }
  }`;

export const RAW_LAUNCHED_ESCROWS_QUERY = (requesterAddress: string) => `{
    launchedEscrows(where: { from: ${requesterAddress} }) {
      id
    }
  }`;

export const RAW_LAUNCHED_ESCROWS_FILTERED_QUERY = (
  address?: string,
  status?: EscrowStatus,
  from?: Date,
  to?: Date
) =>
  `{ launchedEscrows(where: { ${address ? 'from: "' + address + '", ' : ''}${
    status ? 'status: "' + EscrowStatus[status] + '", ' : ''
  }${from ? 'timestamp_gte: "' + from?.valueOf() + '", ' : ''}${
    to ? 'timestamp_lte: "' + to?.valueOf() + '"' : ''
  }}) { id }}`;
