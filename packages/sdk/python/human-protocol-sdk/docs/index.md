# HUMAN Protocol Python SDK

The **HUMAN Protocol Python SDK** provides a comprehensive, Pythonic interface for interacting with HUMAN Protocol smart contracts and off-chain services. It enables developers to build decentralized job marketplaces, data labeling platforms, and other human-in-the-loop applications on blockchain networks.

## Overview

HUMAN Protocol is a decentralized infrastructure for coordinating human work at scale. The Python SDK simplifies integration by providing high-level abstractions for:

- **Escrow Management**: Create, fund, and manage escrow contracts for job distribution
- **Staking Operations**: Stake HMT tokens and manage operator allocations
- **On-chain Storage**: Store and retrieve configuration data using KVStore
- **Operator Discovery**: Query and filter operators by role, reputation, and capabilities
- **Worker Analytics**: Track worker performance and payout history
- **Statistics**: Access protocol-wide metrics and analytics
- **Encryption**: Secure message encryption using PGP for private communications

!!! info "Subgraph access and rate limits"
    The SDK calls public subgraph endpoints by default. Unauthenticated requests are rate-limited and may return errors. For higher limits, use your own [API key](https://thegraph.com/docs/it/subgraphs/querying/managing-api-keys/).

## Key Features

### Smart Contract Interactions

- **Escrow Client**: Full lifecycle management of escrow contracts
    - Create, fund, and configure escrows
    - Bulk payout distribution
    - Store and verify results with hash validation
    - Cancel and refund mechanisms
- **Staking Client**: Manage HMT token staking
    - Stake, unstake, and withdraw operations
    - Slash malicious operators
    - Query staking information
- **KVStore Client**: On-chain key-value storage
    - Store operator configuration
    - Manage URLs with automatic hash verification
    - Retrieve public keys and metadata

### Subgraph Utilities

- **EscrowUtils**: Query escrow data, status events, and payouts
- **OperatorUtils**: Discover operators by role, reputation network, and rewards
- **WorkerUtils**: Access worker statistics and payout history
- **StatisticsUtils**: Retrieve protocol statistics and HMT token metrics
- **TransactionUtils**: Query on-chain transactions with advanced filters

### Developer Tools

- **Encryption**: PGP-based message encryption and signing
- **Filters**: Flexible query builders for subgraph data
- **Type Safety**: Comprehensive type hints for better IDE support
- **Error Handling**: Descriptive exceptions with clear error messages

## Installation

Install the SDK using pip:

```bash
pip install human-protocol-sdk
```

For development installations with additional dependencies:

```bash
pip install human-protocol-sdk[dev]
```

## Quick Start

### Read-Only Operations

Query escrow data without a signer:

```python
from web3 import Web3
from human_protocol_sdk.constants import ChainId
from human_protocol_sdk.escrow import EscrowUtils, EscrowFilter

# Get escrows from the subgraph
escrows = EscrowUtils.get_escrows(
    EscrowFilter(
        chain_id=ChainId.POLYGON_AMOY,
        status=Status.Pending,
    )
)

for escrow in escrows:
    print(f"Escrow: {escrow.address}")
    print(f"Balance: {escrow.balance}")
    print(f"Status: {escrow.status}")
```

### Write Operations

Create and fund an escrow with a signer:

```python
from web3 import Web3
from web3.middleware import SignAndSendRawMiddlewareBuilder
from human_protocol_sdk.escrow import EscrowClient, EscrowConfig

# Initialize Web3 with signer
w3 = Web3(Web3.HTTPProvider("https://polygon-amoy-rpc.com"))
private_key = "YOUR_PRIVATE_KEY"
account = w3.eth.account.from_key(private_key)
w3.eth.default_account = account.address
w3.middleware_onion.inject(
    SignAndSendRawMiddlewareBuilder.build(private_key),
    "SignAndSendRawMiddlewareBuilder",
    layer=0,
)

# Create escrow client
escrow_client = EscrowClient(w3)

# Create escrow configuration
config = EscrowConfig(
    recording_oracle_address="0x...",
    reputation_oracle_address="0x...",
    exchange_oracle_address="0x...",
    recording_oracle_fee=10,
    reputation_oracle_fee=10,
    exchange_oracle_fee=10,
    manifest="https://example.com/manifest.json",
    hash="manifest_hash",
)

# Create and setup escrow
escrow_address = escrow_client.create_fund_and_setup_escrow(
    token_address="0x...",
    amount=Web3.to_wei(100, "ether"),
    job_requester_id="job-123",
    escrow_config=config,
)

print(f"Created escrow: {escrow_address}")
```

### Query Statistics

Access protocol-wide statistics:

```python
from human_protocol_sdk.constants import ChainId
from human_protocol_sdk.statistics import StatisticsUtils

# Get escrow statistics
stats = StatisticsUtils.get_escrow_statistics(ChainId.POLYGON_AMOY)
print(f"Total escrows: {stats.total_escrows}")

# Get HMT token statistics
hmt_stats = StatisticsUtils.get_hmt_statistics(ChainId.POLYGON_AMOY)
print(f"Total holders: {hmt_stats.total_holders}")
print(f"Total transfers: {hmt_stats.total_transfer_count}")
```

### Operator Discovery

Find operators by role and reputation:

```python
from human_protocol_sdk.constants import ChainId
from human_protocol_sdk.operator import OperatorUtils, OperatorFilter

# Find recording oracles
operators = OperatorUtils.get_operators(
    OperatorFilter(
        chain_id=ChainId.POLYGON_AMOY,
        roles=["Recording Oracle"],
    )
)

for operator in operators:
    print(f"Operator: {operator.address}")
    print(f"Role: {operator.role}")
    print(f"Staked: {operator.staked_amount}")
```

## Supported Networks

The SDK supports multiple blockchain networks:

- **Mainnet**: Ethereum, Polygon, BSC
- **Testnets**: Sepolia, Polygon Amoy, BSC Testnet
- **Local Development**: Localhost (Hardhat/Ganache)

Network configurations are automatically loaded based on the Web3 chain ID.

## Architecture

The SDK is organized into several modules:

- **`escrow`**: Escrow contract client and utilities
- **`staking`**: Staking contract client and utilities
- **`kvstore`**: Key-value store client and utilities
- **`operator`**: Operator discovery and management utilities
- **`worker`**: Worker statistics utilities
- **`statistics`**: Protocol statistics utilities
- **`transaction`**: Transaction query utilities
- **`encryption`**: PGP encryption helpers
- **`constants`**: Network configurations and enums
- **`filter`**: Query filter builders

## Requirements

- Python 3.8 or higher
- Web3.py 6.0+
- Access to an Ethereum-compatible RPC endpoint
- (Optional) Private key for transaction signing

## Resources

- [GitHub Repository](https://github.com/humanprotocol/human-protocol)
- [HUMAN Protocol Documentation](https://docs.humanprotocol.org/)
- [Discord Community](https://discord.gg/humanprotocol)
- [Website](https://www.humanprotocol.org/)
