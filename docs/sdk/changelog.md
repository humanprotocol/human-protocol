# CHANGELOG

## Changelog

#### Added

* **Transactions module:** add a transactions module for protocol related transactions tracking.
* **getKVStoreData:** new function to fetch the KVStore for a given address in a given network.

#### Changed

* **Subgraphs:** use the graph decentralized network. It requires to set the environment variable `SUBGRAPH_API_KEY`.
* **getLeaders:** the filter only accepts a chainId now.

#### Deprecated

#### Removed

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
