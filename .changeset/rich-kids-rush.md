---
"@human-protocol/sdk": major
---

### Changed

- Created proper Subgraph types and cast values to the interfaces we have for SDK
- Refactor EscrowUtils, TransactionUtils, OperatorUtils and WorkerUtils methods to fix mismatch types with Subgraph
- Created some mappings to remove duplicated code
- Add the ability to create, fund and setup an escrow with only one transaction
