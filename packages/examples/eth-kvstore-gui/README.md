# How to run web-gui on local

## Requirements

- [nodejs](https://nodejs.org/en/)
- [ganache](https://github.com/trufflesuite/ganache), [anvil](https://book.getfoundry.sh/reference/anvil/) or [hardhat](https://hardhat.org/hardhat-network/docs/overview) for local RPC node
- [nft.storage key](https://nft.storage)
- [alchemy](https://dashboard.alchemy.com/)


## Website Demo

https://web-gui-spiritbro.vercel.app/

## Demo contract address

https://mumbai.polygonscan.com/address/0x05877184aB2ddAb0F9D1fa6c573392fCe7A7a74a


## Development

First you need to make sure you have install all the package run this command in your terminal :

```bash
$ yarn
```

Now run this command to run local RPC node, deploy contracts and start the GUI:

```bash
$ yarn start:local
```


Check that the address of the KVStore contract deployed matches the one in `env.development`, it will look something like this, don't forget also add your nft.storage api key:

```
REACT_APP_NFT_STORAGE_API=<your nft.storage api key>
REACT_APP_CONTRACT=<your contract address>
REACT_APP_ALCHEMY_ID=<your alchemy ID>
REACT_APP_API_URL=<your API URL>
```

Congrats you're now successfully running the web-gui to store key-value on ethereum blockchain

# How to deploy api to generate key

The server to generate key is in `api/` folder you can deploy it simply by using this command:

```bash
$ vercel .
```

Or you can put an already made server to generate key in `REACT_APP_API_URL` like this:

```
REACT_APP_API_URL=https://web-gui-ruby.vercel.app
```

