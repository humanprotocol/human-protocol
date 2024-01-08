# Changelog


### Added
- __Add transaction options:__ passing transaction options when a transaction is sent allows the user to set custom parameters like gas limit, gas price, etc.
- __Add gas estimation:__ add gas estimation as mechanism to verify that the transaction won't fail after being sent. Previously the transaction was sent and fees spent, but it failed if it didn't pass all requirements of the contract call.

### Changed
- __KVStore contract addresses:__ new contracts deployed to include setBulk function.

### Deprecated

### Removed
- __Default value for gas limit in Python:__ gas limit should not be the same for all transactions.
- __Gas price multiplier:__ gas price multiplier has been removed, but now the gas price can be passed as a parameter when the transaction is sent.

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
