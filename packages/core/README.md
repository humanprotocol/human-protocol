<p align="center">
  <a href="https://www.humanprotocol.org/" target="blank"><img src="https://s2.coinmarketcap.com/static/img/coins/64x64/10347.png" width="100" alt="Human Protocol" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

<h1 align="center">Human Protocol Core</h1>
<p align="center">This is the repo of the human protocol smart contracts.</p>

<p align="center">
  <a href="https://github.com/humanprotocol/human-protocol/actions/workflows/ci-test-core.yaml">
    <img src="https://github.com/humanprotocol/human-protocol/actions/workflows/ci-test-core.yaml/badge.svg?branch=main" alt="Core Check">
  </a>
  <a href="https://github.com/humanprotocol/human-protocol/actions/workflows/cd-deploy-contracts.yaml">
    <img src="https://github.com/humanprotocol/human-protocol/actions/workflows/cd-deploy-contracts.yaml/badge.svg?branch=main" alt="Core deployment">
  </a>
</p>

## Contracts

### Escrow

Escrow contract represents the entire life cycle of the job on Human Protocol. Escrow status is usually changed as follows.

`Launched` -> `Pending` -> `Partial` -> `Paid` -> `Completed`

On the other hand, it can be cancelled anytime.

- `constructor(token, launcher, canceler, duration, trustedHandlers)`

  Create a new escrow with ERC20 token for payments, launcher who initiated the call to escrow factory, canceler who receives the money back when the job is cancelled, job duration before expiry, and extra trusted handlers that act like super admin of the escrow. Initial escrow status is `Launched`.

- `setup(reputationOracle, recordingOracle, exchangeOracle, reputationOracleFeePercentage, recordingOracleFeePercentage, exchangeOracleFeePercentage, url, hash)`

  Assigns the reputation, recording, and exchange oracle to the job, with relevant fee percentages. Job manifest url, and hash is also configured at this point. This function should be called after the escrow is funded from the job launcher. The escrow is now in `Pending` status.

  > Only trusted handlers can call this function.

- `storeResults(url, hash)`

  Stores intermediate results. Can be called when the escrow is in `Pending`, or `Partial` status.

  > Trusted handlers, and recording oracle can call this function.

- `bulkPayOut(recipients, amounts, url, hash, txId)`

  Pay out the workers. Final result URL is recorded. If the escrow is fully paid out, escrow status is changed to `Paid`, otherwise it's changed to `Partial`.

  > Trusted handlers, and reputation oracle can call this funciton.

- `complete()`

  Finishes the job. Escrow is now in `Completed` status. Can be called only if the escrow is in `Paid` status.

  > Only trusted handlers can call this function.

- `abort()`

  Cancels the escrow, and self destruct the contract instance.

  > Only trusted handlers can call this function.

- `cancel()`

  Cancels the escrow, and sends the remaining funds to the canceler. Escrow status is changed to `Cancelled`.

  > Only trusted handlers can call this function.

- `addTrustedHandlers(trustedHandlers)`

  Adds more trusted handlers.

  > Only trusted handlers can call this function.

- `getBalance()`

  Get remaining balance of the escrow.

### EscrowFactory

EscrowFactory allows job launchers to create new Escrow contracts.

- `createEscrow(token, trustedHandlers, jobRequesterId)`

  Create a new escrow, which uses ERC20 token for payment, as well as extra trusted handlers. Job launcher is canceler itself, and the job duration is 100 days. Job Requester Id is passed to keep track of job creators. Here, jobRequesterId is an internal id of the Job Launcher, and it can be used to identify the jobs requested by each Job Requester without crossing data between Subgraph and database.

- `hasEscrow(escrow)`

  Check if the escrow is created by EscrowFactory

### HMToken

ERC20 token for Human Protocol, used for escrow payments by default. It has same interface as ERC20, but some other functions are added for bulk payments.

- `transferBulk(recipients, amounts, txId)`

  Transfer to all of the recipients with the amount specified for each of them.

- `increaseApprovalBulk(spenders, amounts, txId)`

  Increase allowance of all spenders with the amount given for each of them.

### Staking

To be considered valid operator on Human Protocol, user needs to stake HMT.

- `stake(amount)`

  Stakes given amount of HMT.

- `unstake(amount)`

  Unstakes given amount of HMT. Unstaked tokens are locked for a lock period, and can't be withdrawn.

- `withdraw()`

  Withdraw unstaked HMT after lock period.

- `slash(slasher, staker, escrow, token)`

  Slash the staker stake allocated to the escrow for abuse contents.

- `allocate(escrow, amount)`

  Allocates staker's stake to the escrow. It's essential to launch the escrow.

- `closeAllocation(escrow)`

  Close an allocation and free the staked tokens.

### Reward Pool

RewardPool is the reward system of Human Protocol. It keeps track of slashes, and distribute reward to the slashers.

- `distributeReward(escrow)`

  Distributes token slashes of the escrow after fee.

- `withdraw(to)`

  Withdraw collected fees to a specific account.

  > Only owner can call this.

### KVStore

KVStore is the simple key-value store.

- `set(key, value)`

  Save `key` -> `value` pair for the user.

- `setBulk(keys, values)`

  Save multiple `key` -> `value` pairs as bulk for the user.

  - `get(account, key)`

  Read the value of the given `key` for the `account`.

## Deployment

### Deploy contracts with proxy to a live network

1. Create a .env file in the root folder of core package, with the following variables(this is an example for Polygon Mumbai, for other networks `check hardhat.config.ts`):

```bash
ETH_POLYGON_MUMBAI_URL=
PRIVATE_KEY=
HMT_ADDRESS=
POLYGONSCAN_API_KEY=
```

2. Open `./scripts/deploy-proxies.ts` and check if you actually need to deploy all the contracts this script deploys.

3. Deploy the contracts runing this ([NETWORK_NAME] = network name from `hardhat.config.ts`):

```bash
yarn deploy:proxy --network [NETWORK_NAME]
```

4. Verify every contract runing the following line for each contract address(for those that use a proxy just verifyin the proxy will verify the implementation too):

```bash
npx hardhat verify --network [NETWORK_NAME] [CONTRACT_ADDRESS]
```

5. Request the Human Protocol team to include the new contract address in the document at https://tech-docs.humanprotocol.org/contracts/contract-addresses.

### Upgrade contracts with proxy

1. Create a .env file in the root folder of core package, with the following variables(this is an example to update EscrowFactory on Polygon Mumbai, if you want to upgrade
   more proxies you need to add the corresponding addresses. Also, for other networks `check hardhat.config.ts`):

```bash
ETH_POLYGON_MUMBAI_URL=
PRIVATE_KEY=
POLYGONSCAN_API_KEY=
ESCROW_FACTORY_ADDRESS=
```

2. Open `./scripts/upgrade-proxies.ts` and add all the proxies you actually need to upgrade.

3. Compile the contract runing this:

```bash
yarn compile
```

4. Deploy the upgraded contract runing this ([NETWORK_NAME] = network name from `hardhat.config.ts`):

```bash
yarn upgrade:proxy --network [NETWORK_NAME]
```

5. Verify the contract runing the following line:

```bash
npx hardhat verify --network [NETWORK_NAME] [CONTRACT_ADDRESS]
```

## Documentation

For detailed information about core, please refer to the [Human Protocol Tech Docs](https://human-protocol.gitbook.io/hub/human-tech-docs/architecture/components/smart-contracts).

## License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/humanprotocol/human-protocol/blob/main/LICENSE) file for details.
