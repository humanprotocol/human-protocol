export const RAW_REWARDS_QUERY = (slasherAddress: string) => `{
  rewardAddedEvents(id: "${slasherAddress}") {
    escrow,
    amount
  }
}`;
