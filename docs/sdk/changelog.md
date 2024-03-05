# Changelog

### Added

- **Added OperatorUtils module:** new module for fetching leaders and operators information.

### Changed

- **Update ethers version:** update ethers to version 6.
- **Update cancel escrow method:** return transaction hash and refunded amount.

### Deprecated

### Removed

- **Remove staking utils module:** the methods from this module have been moved  into the new OperatorUtils module.

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
