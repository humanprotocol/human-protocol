<p align="center">
  <a href="https://www.humanprotocol.org/" target="blank"><img src="https://s2.coinmarketcap.com/static/img/coins/64x64/10347.png" width="100" alt="Human Protocol" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

<h1 align="center">Human Protocol Node.js SDK</h1>
<p align="center">Node.js SDK to launch/manage escrows on <a href="https://www.humanprotocol.org/">Human Protocol</a>
</p>

<p align="center">
  <a href="https://github.com/humanprotocol/human-protocol/actions/workflows/ci-test-node-sdk.yaml">
    <img src="https://github.com/humanprotocol/human-protocol/actions/workflows/ci-test-node-sdk.yaml/badge.svg?branch=main" alt="Node SDK Check">
  </a>
  <a href="https://github.com/humanprotocol/human-protocol/actions/workflows/cd-node-sdk.yaml">
    <img src="https://github.com/humanprotocol/human-protocol/actions/workflows/cd-node-sdk.yaml/badge.svg?event=release" alt="Node SDK deployment">
  </a>
</p>

## Installation

This SDK is available on [NPM](https://www.npmjs.com/package/@human-protocol/sdk).

    yarn add @human-protocol/sdk

## Components

- InitClient

  **InitClient** has one static function that returns a `Signer` or `Provider` (depending on the passed parameter), as well as a chainId associated with this parameter in an asynchronous way. Used for further passing as a constructor parameter to Web3 dependent modules.

- StorageClient

  **StorageClient** is used to upload/download files to the cloud storage with given credentials and params. If credentials are not provided, anonymous access will be used (for downloading files).

- EscrowClient

  **EscrowClient** enables to perform actions on Escrow contracts and obtain information from both the contracts and subgraph. Internally, the SDK will use one network or another according to the network ID of the `signerOrProvider`.

- KVStoreClient

  **KVStoreClient** enables to perform actions on KVStore contract and obtain information from both the contracts and subgraph. Internally, the SDK will use one network or another according to the network ID of the `signerOrProvider`.

- StakingClient

  **StakingClient** enables to perform actions on staking contracts and obtain staking information from both the contracts and subgraph. Internally, the SDK will use one network or another according to the network ID of the `signerOrProvider`.

## Example

```typescript
const {
  EscrowClient,
  StakingClient,
  NETWORKS,
  ChainId,
} = require('@human-protocol/sdk');
const { ethers } = require('ethers');

(async () => {
  // Hardhat Provider
  const provider = new ethers.providers.JsonRpcProvider(
    'http://127.0.0.1:8545/'
  );

  // Load localhost configuration
  const network = NETWORKS[ChainId.LOCALHOST];

  const signer = new ethers.Wallet(
    '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
    provider
  );

  // Initialize StakingClient
  const stakingClient = new StakingClient({
    signerOrProvider: signer,
    network,
  });

  // Stake 10 HMT
  await stakingClient.approveStake(ethers.BigNumber.from(10));
  await stakingClient.stake(ethers.BigNumber.from(10));

  // Initialize EscrowClient
  const escrowClient = new EscrowClient({
    signerOrProvider: signer,
    network,
  });

  // Create a new escrow, and setup
  const escrowAddress = await escrowClient.createEscrow(network.hmtAddress, [
    signer.address,
  ]);

  await escrowClient.setup(escrowAddress, {
    recordingOracle: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    reputationOracle: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    exchangeOracle: '0x6b7E3C31F34cF38d1DFC1D9A8A59482028395809',
    recordingOracleFee: ethers.BigNumber.from(1),
    reputationOracleFee: ethers.BigNumber.from(1),
    exchangeOracleFee: ethers.BigNumber.from(1),
    manifestUrl: 'http://example.com',
    hash: 'test',
  });
})();
```
