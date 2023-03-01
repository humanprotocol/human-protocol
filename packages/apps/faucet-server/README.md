# :coin: Testnet Faucet ![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg) ![Ask Me Anything !](https://img.shields.io/badge/Ask%20me-anything-pink.svg)

![forthebadge](https://forthebadge.com/images/badges/made-with-typescript.svg)
![forthebadge](https://forthebadge.com/images/badges/powered-by-coffee.svg)

This is a faucet for private Ethereum testnet.

## How to Use 🍕

### Step 1: Create config file and faucet account.

- Create account file `faucet_account` in `config` folder (Note that if multiple accounts exist, only the first account will be used as the faucet account).
This can be done by, e.g., calling `web3.eth.accounts.create`, encrypting it with a password `web3.eth.accounts.wallet.encrypt` and then saving to `config/faucet_account`.

- Create a config file `config.json` in `config` folder. It should include properties in the following table.

| Property | Description |
| --- | ----------- |
| `rpcURL` | The ip address and port of your private testnet |
| `payoutFrequency` | The waiting time (in seconds) between consecutive payments. |
| `dailyLimit` | The daily supply limit (in ether) for a single account address. |
| `serverPort` | The port to run express server. Default to 8000. |

- A simple example:

```json
{
    "rpcURL": "http://12.34.56.78:90",
    "payoutFrequency": 10,
    "dailyLimit": 10,
    "serverPort": 8000
}
```

### Step 2: Build client.

You can customize the name of your testnet in the `faucet-panel` component.

```shell
cd client 
npm install
npm run build
cd ..
```

### Step 3: Run server.

```shell
npx ts-node server/index.ts your-account-password
```