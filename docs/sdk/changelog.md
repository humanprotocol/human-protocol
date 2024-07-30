# CHANGELOG

## Changelog

#### Added

* Added getStatusEvents function.
* Added daily unique sender/receiver metrics to HMT statistics.
* Add get HMT holders.

#### Changed

* Added pagination and ordering to get escrows.
* Added pagination and ordering to get transactions

#### Deprecated

#### Removed

* Remove fetching from an array of networks.

#### Fixed

* Rename hash to txHash in get transactions.

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
