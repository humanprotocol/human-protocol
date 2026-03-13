# @human-protocol/core

## 6.0.0

### Major Changes

- a7ab394: Updated escrow contracts and SDKs to fetch oracle fees from `KVStore` instead of passing fee values during escrow setup. `Escrow.setup(...)` and factory setup flows no longer accept fee arguments, escrow deployments now require a `KVStore` address, and fee validation is enforced on-chain from `KVStore` values, including per-oracle and total fee limits. Added upgrade-safe `EscrowFactory` support for storing and updating the `KVStore` address.

  Updated TypeScript and Python SDK escrow setup APIs to match the new contract signatures by removing fee arguments from `setup(...)` and create-and-setup helpers. Existing config fee fields remain optional for backward compatibility but are ignored by setup calls.

  Updated SDKs to use a dedicated HMT stats subgraph endpoint for HMT statistics methods and removed `totalAmountPaid` and `averageAmountPerWorker` from `IDailyPayment`.
