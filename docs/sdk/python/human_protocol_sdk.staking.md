# human_protocol_sdk.staking package

This module enables to perform actions on staking contracts and
obtain staking information from both the contracts and subgraph.

## Submodules

* [human_protocol_sdk.staking.staking_client module](human_protocol_sdk.staking.staking_client.md)
  * [Code Example](human_protocol_sdk.staking.staking_client.md#code-example)
  * [Module](human_protocol_sdk.staking.staking_client.md#module)
  * [`AllocationData`](human_protocol_sdk.staking.staking_client.md#human_protocol_sdk.staking.staking_client.AllocationData)
    * [`AllocationData.__init__()`](human_protocol_sdk.staking.staking_client.md#human_protocol_sdk.staking.staking_client.AllocationData.__init__)
  * [`StakingClient`](human_protocol_sdk.staking.staking_client.md#human_protocol_sdk.staking.staking_client.StakingClient)
    * [`StakingClient.__init__()`](human_protocol_sdk.staking.staking_client.md#human_protocol_sdk.staking.staking_client.StakingClient.__init__)
    * [`StakingClient.allocate()`](human_protocol_sdk.staking.staking_client.md#human_protocol_sdk.staking.staking_client.StakingClient.allocate)
    * [`StakingClient.approve_stake()`](human_protocol_sdk.staking.staking_client.md#human_protocol_sdk.staking.staking_client.StakingClient.approve_stake)
    * [`StakingClient.close_allocation()`](human_protocol_sdk.staking.staking_client.md#human_protocol_sdk.staking.staking_client.StakingClient.close_allocation)
    * [`StakingClient.distribute_reward()`](human_protocol_sdk.staking.staking_client.md#human_protocol_sdk.staking.staking_client.StakingClient.distribute_reward)
    * [`StakingClient.get_allocation()`](human_protocol_sdk.staking.staking_client.md#human_protocol_sdk.staking.staking_client.StakingClient.get_allocation)
    * [`StakingClient.slash()`](human_protocol_sdk.staking.staking_client.md#human_protocol_sdk.staking.staking_client.StakingClient.slash)
    * [`StakingClient.stake()`](human_protocol_sdk.staking.staking_client.md#human_protocol_sdk.staking.staking_client.StakingClient.stake)
    * [`StakingClient.unstake()`](human_protocol_sdk.staking.staking_client.md#human_protocol_sdk.staking.staking_client.StakingClient.unstake)
    * [`StakingClient.withdraw()`](human_protocol_sdk.staking.staking_client.md#human_protocol_sdk.staking.staking_client.StakingClient.withdraw)
  * [`StakingClientError`](human_protocol_sdk.staking.staking_client.md#human_protocol_sdk.staking.staking_client.StakingClientError)
* [human_protocol_sdk.staking.staking_utils module](human_protocol_sdk.staking.staking_utils.md)
  * [Code Example](human_protocol_sdk.staking.staking_utils.md#code-example)
  * [Module](human_protocol_sdk.staking.staking_utils.md#module)
  * [`LeaderData`](human_protocol_sdk.staking.staking_utils.md#human_protocol_sdk.staking.staking_utils.LeaderData)
    * [`LeaderData.__init__()`](human_protocol_sdk.staking.staking_utils.md#human_protocol_sdk.staking.staking_utils.LeaderData.__init__)
  * [`LeaderFilter`](human_protocol_sdk.staking.staking_utils.md#human_protocol_sdk.staking.staking_utils.LeaderFilter)
    * [`LeaderFilter.__init__()`](human_protocol_sdk.staking.staking_utils.md#human_protocol_sdk.staking.staking_utils.LeaderFilter.__init__)
  * [`RewardData`](human_protocol_sdk.staking.staking_utils.md#human_protocol_sdk.staking.staking_utils.RewardData)
    * [`RewardData.__init__()`](human_protocol_sdk.staking.staking_utils.md#human_protocol_sdk.staking.staking_utils.RewardData.__init__)
  * [`StakingUtils`](human_protocol_sdk.staking.staking_utils.md#human_protocol_sdk.staking.staking_utils.StakingUtils)
    * [`StakingUtils.get_leader()`](human_protocol_sdk.staking.staking_utils.md#human_protocol_sdk.staking.staking_utils.StakingUtils.get_leader)
    * [`StakingUtils.get_leaders()`](human_protocol_sdk.staking.staking_utils.md#human_protocol_sdk.staking.staking_utils.StakingUtils.get_leaders)
    * [`StakingUtils.get_rewards_info()`](human_protocol_sdk.staking.staking_utils.md#human_protocol_sdk.staking.staking_utils.StakingUtils.get_rewards_info)
