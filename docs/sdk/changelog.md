# CHANGELOG

## Changelog

#### Added

* Add a withdraw function:
  * This allows trusted handlers to withdraw tokens from the escrow contract, even if they are not the funding token.
  * This change helps prevent tokens from being accidentally locked in the contract.
* Add a force complete parameter to the bulk payout function, It forces escrow completion by sending the remaining balance of the escrow back to the job launcher.

#### Changed

* Update subgraph IDs.
* Update the leader entity:
  * Remove amount allocated.
  * Remove reputation.
  * Add reputation networks.
* Modify getTransactions in the transaction utils to include internal transaction data.

#### Deprecated

#### Removed

* Remove reward pool address because the contract has been deleted.
* Delete create and setup escrow functions. The new launching order is:
  1. Create
  2. Fund
  3. Setup
* Delete the escrow abort function.
* Remove all allocation-related functions from the staking client.

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
