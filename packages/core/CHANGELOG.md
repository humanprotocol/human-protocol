# @human-protocol/core

## 7.1.0

### Minor Changes

- 3818511: chore: dependencies bump

## 7.0.0

### Major Changes

- e0cd1db: Update escrow oracle fee handling so oracle fees are reserved independently from worker payouts.

  The escrow contract now reserves oracle fees separately from worker payouts and transfers them on finalization, including when worker submissions are rejected. The SDK adds escrow fund amount accessors so clients and oracles can read the original funded amount and remaining worker payout funds.

## 6.0.0

### Major Changes

- a7ab394: Updated escrow contracts and SDKs to fetch oracle fees from `KVStore` instead of passing fee values during escrow setup. `Escrow.setup(...)` and factory setup flows no longer accept fee arguments, escrow deployments now require a `KVStore` address, and fee validation is enforced on-chain from `KVStore` values, including per-oracle and total fee limits. Added upgrade-safe `EscrowFactory` support for storing and updating the `KVStore` address.

  Updated TypeScript and Python SDK escrow setup APIs to match the new contract signatures by removing fee arguments from `setup(...)` and create-and-setup helpers. Existing config fee fields remain optional for backward compatibility but are ignored by setup calls.

  Updated SDKs to use a dedicated HMT stats subgraph endpoint for HMT statistics methods and removed `totalAmountPaid` and `averageAmountPerWorker` from `IDailyPayment`.
