# HUMAN Protocol TypeScript SDK

The **HUMAN Protocol TypeScript SDK** provides a comprehensive, type-safe interface for interacting with HUMAN Protocol smart contracts and off-chain services. It enables developers to build decentralized job marketplaces, data labeling platforms, and other human-in-the-loop applications on blockchain networks.

## Overview

HUMAN Protocol is a decentralized infrastructure for coordinating human work at scale. The TypeScript SDK simplifies integration by providing high-level abstractions for:

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

### Smart Contract Clients

- **EscrowClient**: Full lifecycle management of escrow contracts
    - Create, fund, and configure escrows
    - Bulk payout distribution with string-based IDs
    - Store and verify results with hash validation
    - Cancel, request cancellation, and refund mechanisms
    - Withdraw additional tokens
- **StakingClient**: Manage HMT token staking
    - Stake, unstake, and withdraw operations
    - Slash malicious operators
    - Query staking information
- **KVStoreClient**: On-chain key-value storage
    - Store operator configuration
    - Manage URLs with automatic hash verification
    - Retrieve public keys and metadata

### Subgraph Utilities

- **EscrowUtils**: Query escrow data, status events, payouts, and cancellation refunds
- **OperatorUtils**: Discover operators by role, reputation network, and rewards
- **StakingUtils**: Access staker information and statistics
- **WorkerUtils**: Query worker statistics and payout history
- **StatisticsUtils**: Retrieve protocol statistics and HMT token metrics
- **TransactionUtils**: Query on-chain transactions with advanced filters

### Developer Tools

- **EncryptionUtils**: PGP-based message encryption, signing, and key generation
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Error Handling**: Descriptive exceptions with clear error messages
- **Flexible Filters**: Query builders for subgraph data with pagination and ordering
- **Multi-network Support**: Built-in configurations for multiple chains

## Installation

### npm

```bash
npm install @human-protocol/sdk
```

### yarn

```bash
yarn add @human-protocol/sdk
```

!!! warning "Keep ethers in sync"
    The SDK is built against a specific `ethers` major/minor (currently `6.15.x`). Pin the same major/minor in your app. Mixing different minors (e.g., `6.16.x` with the SDK) can trigger errors.

## Quick Start

### Read-Only Operations

Query escrow data without a signer:

```typescript
import { EscrowUtils, ChainId, EscrowStatus } from '@human-protocol/sdk';

// Get escrows from the subgraph
const escrows = await EscrowUtils.getEscrows({
  chainId: ChainId.POLYGON_AMOY,
  status: EscrowStatus.Pending,
  first: 10,
});

for (const escrow of escrows) {
  console.log(`Escrow: ${escrow.address}`);
  console.log(`Balance: ${escrow.balance}`);
  console.log(`Status: ${escrow.status}`);
}
```

### Write Operations

Create and fund an escrow with a signer:

```typescript
import { EscrowClient } from '@human-protocol/sdk';
import { Wallet, JsonRpcProvider, parseUnits } from 'ethers';

// Initialize provider and signer
const provider = new JsonRpcProvider('https://polygon-amoy-rpc.com');
const signer = new Wallet('YOUR_PRIVATE_KEY', provider);

// Create escrow client
const escrowClient = await EscrowClient.build(signer);

// Create escrow configuration
const escrowConfig = {
  recordingOracle: '0x...',
  reputationOracle: '0x...',
  exchangeOracle: '0x...',
  recordingOracleFee: 10n,
  reputationOracleFee: 10n,
  exchangeOracleFee: 10n,
  manifest: 'https://example.com/manifest.json',
  manifestHash: 'manifest_hash',
};

// Create and setup escrow
const escrowAddress = await escrowClient.createFundAndSetupEscrow(
  '0x...', // token address
  parseUnits('100', 18),
  'job-requester-123',
  escrowConfig
);

console.log(`Created escrow: ${escrowAddress}`);
```

### Query Statistics

Access protocol-wide statistics:

```typescript
import { StatisticsUtils, ChainId, NETWORKS } from '@human-protocol/sdk';

// Get network data
const networkData = NETWORKS[ChainId.POLYGON_AMOY];

// Get escrow statistics
const stats = await StatisticsUtils.getEscrowStatistics(networkData);
console.log(`Total escrows: ${stats.totalEscrows}`);

// Get HMT token statistics
const hmtStats = await StatisticsUtils.getHMTStatistics(networkData);
console.log(`Total holders: ${hmtStats.totalHolders}`);
console.log(`Total transfers: ${hmtStats.totalTransferCount}`);
```

### Operator Discovery

Find operators by role and reputation:

```typescript
import { OperatorUtils, ChainId } from '@human-protocol/sdk';

// Find recording oracles
const operators = await OperatorUtils.getOperators({
  chainId: ChainId.POLYGON_AMOY,
  roles: ['Recording Oracle'],
  first: 10,
});

for (const operator of operators) {
  console.log(`Operator: ${operator.address}`);
  console.log(`Role: ${operator.role}`);
  console.log(`Staked: ${operator.stakedAmount}`);
}
```

### Encryption

Encrypt and decrypt messages using PGP:

```typescript
import { Encryption, EncryptionUtils } from '@human-protocol/sdk';

// Generate key pair
const keyPair = await EncryptionUtils.generateKeyPair(
  'Alice',
  'alice@example.com',
  'passphrase123'
);

// Initialize encryption with private key
const encryption = await Encryption.build(
  keyPair.privateKey,
  'passphrase123'
);

// Sign and encrypt a message
const publicKeys = [keyPair.publicKey, 'OTHER_PUBLIC_KEY'];
const encrypted = await encryption.signAndEncrypt('Hello, HUMAN!', publicKeys);

// Decrypt and verify
const decrypted = await encryption.decrypt(encrypted, keyPair.publicKey);
console.log(new TextDecoder().decode(decrypted));
```

## Supported Networks

The SDK supports multiple blockchain networks:

- **Mainnet**: Ethereum, Polygon, BSC
- **Testnets**: Sepolia, Polygon Amoy, BSC Testnet
- **Local Development**: Localhost (Hardhat/Ganache)

Network configurations are automatically loaded based on the provider's chain ID.

## Architecture

The SDK is organized into several modules:

- **`escrow`**: Escrow contract client and utilities
- **`staking`**: Staking contract client and utilities
- **`kvstore`**: Key-value store client and utilities
- **`operator`**: Operator discovery and management utilities
- **`worker`**: Worker statistics utilities
- **`statistics`**: Protocol statistics utilities (instance-based and static methods)
- **`transaction`**: Transaction query utilities
- **`encryption`**: PGP encryption helpers (instance-based and static methods)
- **`constants`**: Network configurations and enums
- **`types`**: TypeScript type definitions
- **`interfaces`**: Interface definitions for data structures

## Usage Patterns

### Client Classes vs Utility Classes

The SDK provides two patterns for interacting with the protocol:

**Client Classes** (require Signer/Provider):
- `EscrowClient`
- `StakingClient`
- `KVStoreClient`

```typescript
const client = await EscrowClient.build(signerOrProvider);
const balance = await client.getBalance(escrowAddress);
```

**Utility Classes** (static methods, no initialization):
- `EscrowUtils`
- `StakingUtils`
- `KVStoreUtils`
- `OperatorUtils`
- `WorkerUtils`
- `StatisticsUtils`
- `TransactionUtils`

```typescript
const escrows = await EscrowUtils.getEscrows(filter);
const operators = await OperatorUtils.getOperators(filter);
```

### Subgraph Configuration

Control subgraph requests with optional parameters:

```typescript
const escrows = await EscrowUtils.getEscrows(
  filter,
  {
    maxRetries: 3,
    baseDelay: 1000,
    indexerId: 'specific-indexer-id'
  }
);
```

Environment variable for API key:

```bash
export SUBGRAPH_API_KEY="your-api-key"
```

## Requirements

- Node.js 16.0 or higher
- TypeScript 4.7+ (for development)
- ethers.js 6.0+
- Access to an Ethereum-compatible RPC endpoint
- (Optional) Private key for transaction signing

## Resources

- [GitHub Repository](https://github.com/humanprotocol/human-protocol)
- [HUMAN Protocol Documentation](https://docs.humanprotocol.org/)
- [Discord Community](https://discord.gg/humanprotocol)
- [Website](https://www.humanprotocol.org/)

## License

MIT License - see [LICENSE](LICENSE) for details.
