<!-- Human Protocol SDK documentation master file, created by
sphinx-quickstart on Mon Nov  6 07:49:01 2023.
You can adapt this file completely to your liking, but it should at least
contain the root `toctree` directive. -->

# Welcome to Human Protocol SDK’s documentation!

## Installation

To install the Human Protocol SDK, run the following command:

```bash
pip install human-protocol-sdk
```

In case you want to use the features of the agreement module, make sure to install corresponding extras as well.

```bash
pip install human-protocol-sdk[agreement]
```

## Contents:

* [human_protocol_sdk package](human_protocol_sdk.md)
  * [Subpackages](human_protocol_sdk.md#subpackages)
    * [human_protocol_sdk.agreement package](human_protocol_sdk.agreement.md)
      * [Getting Started](human_protocol_sdk.agreement.md#getting-started)
      * [Submodules](human_protocol_sdk.agreement.md#submodules)
  * [Submodules](human_protocol_sdk.md#submodules)
    * [human_protocol_sdk.constants module](human_protocol_sdk.constants.md)
      * [`ChainId`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.ChainId)
      * [`Role`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.Role)
      * [`Status`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.Status)
    * [human_protocol_sdk.encryption module](human_protocol_sdk.encryption.md)
      * [A simple example](human_protocol_sdk.encryption.md#a-simple-example)
      * [`Encryption`](human_protocol_sdk.encryption.md#human_protocol_sdk.encryption.Encryption)
      * [`EncryptionUtils`](human_protocol_sdk.encryption.md#human_protocol_sdk.encryption.EncryptionUtils)
    * [human_protocol_sdk.escrow module](human_protocol_sdk.escrow.md)
      * [A simple example](human_protocol_sdk.escrow.md#a-simple-example)
      * [`EscrowClient`](human_protocol_sdk.escrow.md#human_protocol_sdk.escrow.EscrowClient)
      * [`EscrowClientError`](human_protocol_sdk.escrow.md#human_protocol_sdk.escrow.EscrowClientError)
      * [`EscrowConfig`](human_protocol_sdk.escrow.md#human_protocol_sdk.escrow.EscrowConfig)
      * [`EscrowData`](human_protocol_sdk.escrow.md#human_protocol_sdk.escrow.EscrowData)
      * [`EscrowUtils`](human_protocol_sdk.escrow.md#human_protocol_sdk.escrow.EscrowUtils)
    * [human_protocol_sdk.filter module](human_protocol_sdk.filter.md)
      * [`EscrowFilter`](human_protocol_sdk.filter.md#human_protocol_sdk.filter.EscrowFilter)
      * [`FilterError`](human_protocol_sdk.filter.md#human_protocol_sdk.filter.FilterError)
      * [`PayoutFilter`](human_protocol_sdk.filter.md#human_protocol_sdk.filter.PayoutFilter)
    * [human_protocol_sdk.kvstore module](human_protocol_sdk.kvstore.md)
      * [A simple example](human_protocol_sdk.kvstore.md#a-simple-example)
      * [`KVStoreClient`](human_protocol_sdk.kvstore.md#human_protocol_sdk.kvstore.KVStoreClient)
      * [`KVStoreClientError`](human_protocol_sdk.kvstore.md#human_protocol_sdk.kvstore.KVStoreClientError)
    * [human_protocol_sdk.legacy_encryption module](human_protocol_sdk.legacy_encryption.md)
      * [`DecryptionError`](human_protocol_sdk.legacy_encryption.md#human_protocol_sdk.legacy_encryption.DecryptionError)
      * [`Encryption`](human_protocol_sdk.legacy_encryption.md#human_protocol_sdk.legacy_encryption.Encryption)
      * [`InvalidPublicKey`](human_protocol_sdk.legacy_encryption.md#human_protocol_sdk.legacy_encryption.InvalidPublicKey)
    * [human_protocol_sdk.staking module](human_protocol_sdk.staking.md)
      * [A simple example](human_protocol_sdk.staking.md#a-simple-example)
      * [`AllocationData`](human_protocol_sdk.staking.md#human_protocol_sdk.staking.AllocationData)
      * [`LeaderData`](human_protocol_sdk.staking.md#human_protocol_sdk.staking.LeaderData)
      * [`LeaderFilter`](human_protocol_sdk.staking.md#human_protocol_sdk.staking.LeaderFilter)
      * [`RewardData`](human_protocol_sdk.staking.md#human_protocol_sdk.staking.RewardData)
      * [`StakingClient`](human_protocol_sdk.staking.md#human_protocol_sdk.staking.StakingClient)
      * [`StakingClientError`](human_protocol_sdk.staking.md#human_protocol_sdk.staking.StakingClientError)
      * [`StakingUtils`](human_protocol_sdk.staking.md#human_protocol_sdk.staking.StakingUtils)
    * [human_protocol_sdk.statistics module](human_protocol_sdk.statistics.md)
      * [A simple example](human_protocol_sdk.statistics.md#a-simple-example)
      * [`DailyEscrowData`](human_protocol_sdk.statistics.md#human_protocol_sdk.statistics.DailyEscrowData)
      * [`DailyHMTData`](human_protocol_sdk.statistics.md#human_protocol_sdk.statistics.DailyHMTData)
      * [`DailyPaymentData`](human_protocol_sdk.statistics.md#human_protocol_sdk.statistics.DailyPaymentData)
      * [`DailyWorkerData`](human_protocol_sdk.statistics.md#human_protocol_sdk.statistics.DailyWorkerData)
      * [`EscrowStatistics`](human_protocol_sdk.statistics.md#human_protocol_sdk.statistics.EscrowStatistics)
      * [`HMTHolder`](human_protocol_sdk.statistics.md#human_protocol_sdk.statistics.HMTHolder)
      * [`HMTStatistics`](human_protocol_sdk.statistics.md#human_protocol_sdk.statistics.HMTStatistics)
      * [`PaymentStatistics`](human_protocol_sdk.statistics.md#human_protocol_sdk.statistics.PaymentStatistics)
      * [`StatisticsClient`](human_protocol_sdk.statistics.md#human_protocol_sdk.statistics.StatisticsClient)
      * [`StatisticsClientError`](human_protocol_sdk.statistics.md#human_protocol_sdk.statistics.StatisticsClientError)
      * [`StatisticsParam`](human_protocol_sdk.statistics.md#human_protocol_sdk.statistics.StatisticsParam)
      * [`WorkerStatistics`](human_protocol_sdk.statistics.md#human_protocol_sdk.statistics.WorkerStatistics)
    * [human_protocol_sdk.storage module](human_protocol_sdk.storage.md)
      * [A simple example](human_protocol_sdk.storage.md#a-simple-example)
      * [`Credentials`](human_protocol_sdk.storage.md#human_protocol_sdk.storage.Credentials)
      * [`StorageClient`](human_protocol_sdk.storage.md#human_protocol_sdk.storage.StorageClient)
      * [`StorageClientError`](human_protocol_sdk.storage.md#human_protocol_sdk.storage.StorageClientError)
      * [`StorageFileNotFoundError`](human_protocol_sdk.storage.md#human_protocol_sdk.storage.StorageFileNotFoundError)
    * [human_protocol_sdk.utils module](human_protocol_sdk.utils.md)
      * [`get_contract_interface()`](human_protocol_sdk.utils.md#human_protocol_sdk.utils.get_contract_interface)
      * [`get_data_from_subgraph()`](human_protocol_sdk.utils.md#human_protocol_sdk.utils.get_data_from_subgraph)
      * [`get_erc20_interface()`](human_protocol_sdk.utils.md#human_protocol_sdk.utils.get_erc20_interface)
      * [`get_escrow_interface()`](human_protocol_sdk.utils.md#human_protocol_sdk.utils.get_escrow_interface)
      * [`get_factory_interface()`](human_protocol_sdk.utils.md#human_protocol_sdk.utils.get_factory_interface)
      * [`get_hmt_balance()`](human_protocol_sdk.utils.md#human_protocol_sdk.utils.get_hmt_balance)
      * [`get_kvstore_interface()`](human_protocol_sdk.utils.md#human_protocol_sdk.utils.get_kvstore_interface)
      * [`get_reward_pool_interface()`](human_protocol_sdk.utils.md#human_protocol_sdk.utils.get_reward_pool_interface)
      * [`get_staking_interface()`](human_protocol_sdk.utils.md#human_protocol_sdk.utils.get_staking_interface)
      * [`handle_transaction()`](human_protocol_sdk.utils.md#human_protocol_sdk.utils.handle_transaction)
      * [`parse_transfer_transaction()`](human_protocol_sdk.utils.md#human_protocol_sdk.utils.parse_transfer_transaction)
      * [`validate_url()`](human_protocol_sdk.utils.md#human_protocol_sdk.utils.validate_url)
      * [`with_retry()`](human_protocol_sdk.utils.md#human_protocol_sdk.utils.with_retry)
