# Changelog

### Added

- **Add function to get the encryption public key:** get public key function added to KVStore client.

### Changed

- **Rename set url function of KVStore client:** function renamed to be descriptive. This function sets the url and the hash
- **Rename get url function of KVStore client:** function renamed to be descriptive. This function gets the url and verifies the hash of the content.
- **Convert operators config keys to snake_case:** use snake_case as standard.

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
