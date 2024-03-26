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
    * [human_protocol_sdk.encryption package](human_protocol_sdk.encryption.md)
      * [Submodules](human_protocol_sdk.encryption.md#submodules)
    * [human_protocol_sdk.escrow package](human_protocol_sdk.escrow.md)
      * [Submodules](human_protocol_sdk.escrow.md#submodules)
    * [human_protocol_sdk.kvstore package](human_protocol_sdk.kvstore.md)
      * [Submodules](human_protocol_sdk.kvstore.md#submodules)
    * [human_protocol_sdk.staking package](human_protocol_sdk.staking.md)
      * [Submodules](human_protocol_sdk.staking.md#submodules)
    * [human_protocol_sdk.statistics package](human_protocol_sdk.statistics.md)
      * [Submodules](human_protocol_sdk.statistics.md#submodules)
    * [human_protocol_sdk.storage package](human_protocol_sdk.storage.md)
      * [Submodules](human_protocol_sdk.storage.md#submodules)
  * [Submodules](human_protocol_sdk.md#submodules)
    * [human_protocol_sdk.constants module](human_protocol_sdk.constants.md)
      * [`ChainId`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.ChainId)
      * [`KVStoreKeys`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.KVStoreKeys)
      * [`Role`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.Role)
      * [`Status`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.Status)
    * [human_protocol_sdk.filter module](human_protocol_sdk.filter.md)
      * [`EscrowFilter`](human_protocol_sdk.filter.md#human_protocol_sdk.filter.EscrowFilter)
      * [`FilterError`](human_protocol_sdk.filter.md#human_protocol_sdk.filter.FilterError)
      * [`PayoutFilter`](human_protocol_sdk.filter.md#human_protocol_sdk.filter.PayoutFilter)
    * [human_protocol_sdk.legacy_encryption module](human_protocol_sdk.legacy_encryption.md)
      * [`DecryptionError`](human_protocol_sdk.legacy_encryption.md#human_protocol_sdk.legacy_encryption.DecryptionError)
      * [`Encryption`](human_protocol_sdk.legacy_encryption.md#human_protocol_sdk.legacy_encryption.Encryption)
      * [`InvalidPublicKey`](human_protocol_sdk.legacy_encryption.md#human_protocol_sdk.legacy_encryption.InvalidPublicKey)
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
