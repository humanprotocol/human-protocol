# changelog

## Changelog

#### Added

#### Changed

* allow `manifest` to be a JSON string
* `EscrowClient.setup` now accepts `manifest` instead of `manifestUrl`
* `EscrowClient.getManifestUrl` -> `EscrowClient.getManifest`
* `manifestUrl` -> `manifest` in `IEscrow`

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
