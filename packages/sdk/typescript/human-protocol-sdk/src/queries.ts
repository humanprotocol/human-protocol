export const RAW_REWARDS_QUERY = (slasherAddress: string) => `{
    rewardAddedEvents(id: "${slasherAddress}") {
      escrow,
      amount
    }
  }`;

export const RAW_LAUNCHED_ESCROWS_QUERY = () => `{
    launchedEscrows(where: { from: $address }) {
      id
    }
  }`;

export const RAW_LAUNCHED_ESCROWS_FILTERED_QUERY = () => `{
    launchedEscrows(where: { from: $address, status: $status, timestamp_gte: $from, timestamp_lte: $to }) {
      id
    }
  }`;
