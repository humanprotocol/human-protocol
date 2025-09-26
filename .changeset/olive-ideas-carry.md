---
"@human-protocol/sdk": minor
---

# Changelog

### Changed

- Relaxed several SDK return types (EscrowUtils, OperatorUtils, TransactionUtils, WorkerUtils) to allow `null` when a subgraph entity does not exist.

# How to upgrade

## TypeScript

### yarn

```bash
yarn upgrade @human-protocol/sdk
```

### npm

```bash
npm update @human-protocol/sdk
```
