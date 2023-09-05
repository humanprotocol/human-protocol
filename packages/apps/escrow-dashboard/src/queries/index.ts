export const RAW_LEADERS_QUERY = `{
  leaders(orderBy: amountStaked, orderDirection: desc) {
    id
    address
    role
    amountStaked
    amountAllocated
    amountLocked
    lockedUntilTimestamp
    amountSlashed
    amountWithdrawn
    reputation
    amountJobsLaunched
  }
}`;

export const RAW_LEADER_QUERY = (address: string) => `{
  leader(id: "${address}") {
    id
    address
    role
    amountStaked
    amountAllocated
    amountLocked
    lockedUntilTimestamp
    amountSlashed
    amountWithdrawn
    reputation
    amountJobsLaunched
  }
}`;

export const RAW_DATA_SAVED_EVENTS_QUERY = `{
  dataSavedEvents(where: {key: $key, leader: $leader}, orderBy: timestamp, orderDirection: desc) {
    leader
    key
    value
    timestamp
  }
}`;

export const RAW_LEADER_ESCROWS_QUERY = (address: string) => `{
  launchedEscrows(from: "${address}", orderBy: amountAllocated, orderDirection: desc) {
    id
    amountAllocated
    amountPayout
    status
  }
}`;
