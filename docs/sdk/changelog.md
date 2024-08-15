# CHANGELOG

## Changelog

#### Added

* Add is\_encrypted function to encryption utils (python).

#### Changed

* Move get functions from KVStore client to KVStore utils.
* Replace amountJobsLaunched by amountJobsProcessed in getLeader.
* Modify statistics module.

#### Deprecated

#### Removed

* Remove fee values from get escrows.

#### Fixed

#### Security

## How to upgrade

### Typescript

#### yarn

```
yarn upgrade @human-protocol/sdk
```

#### npm

```
npm update @human-protocol/sdk
```

### Python

```
pip install --upgrade human-protocol-sdk
```
