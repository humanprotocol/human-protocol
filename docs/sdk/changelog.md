# Changelog

### Added

### Changed

- Relaxed several SDK return types (EscrowUtils, OperatorUtils, TransactionUtils, WorkerUtils) to allow `null` when a subgraph entity does not exist.
- EscrowUtils.getEscrow now includes `chainId` in the returned object.

### Deprecated

### Removed

### Fixed

### Security

# How to upgrade

## Typescript

### yarn

```
yarn upgrade @human-protocol/sdk
```

### npm

```
npm update @human-protocol/sdk
```

## Python

```
pip install --upgrade human-protocol-sdk
```
