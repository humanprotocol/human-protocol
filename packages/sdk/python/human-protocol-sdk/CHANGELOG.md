# @human-protocol/python-sdk

## 7.2.0

### Minor Changes

- af6ec22: Add cancellationRequestedAt field to Escrow data model

## 7.1.0

### Minor Changes

- 7da7b12: Extended SDK to return block and tx hash for "getStatusEvents".
  Fixed "status" field in return value to be consistent in SDKs.

### Patch Changes

- a49202f: Delete references to totalHMTAmountReceived that was removed from subgraph

## 7.0.0

### Major Changes

- a7ab394: Updated KV Store utils in sdk to return empty string in case no value in subgraph instead of throwing and error
- a7ab394: Updated escrow contracts and SDKs to fetch oracle fees from `KVStore` instead of passing fee values during escrow setup. `Escrow.setup(...)` and factory setup flows no longer accept fee arguments, escrow deployments now require a `KVStore` address, and fee validation is enforced on-chain from `KVStore` values, including per-oracle and total fee limits. Added upgrade-safe `EscrowFactory` support for storing and updating the `KVStore` address.

  Updated TypeScript and Python SDK escrow setup APIs to match the new contract signatures by removing fee arguments from `setup(...)` and create-and-setup helpers. Existing config fee fields remain optional for backward compatibility but are ignored by setup calls.

  Updated SDKs to use a dedicated HMT stats subgraph endpoint for HMT statistics methods and removed `totalAmountPaid` and `averageAmountPerWorker` from `IDailyPayment`.

### Patch Changes

- Updated dependencies [a7ab394]
  - @human-protocol/core@6.0.0

## 6.1.0

### Minor Changes

- 39e76d1: Enhance transaction handling with timeout and confirmations

### Patch Changes

- cb2a6aa: Add prune to subgraph and update ids for the new version
- 68da3b1: Remove SUBGRAPH_API_KEY placeholder and simplify subgraph URL handling
