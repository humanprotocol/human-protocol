# How to run web-gui on local

## Requirements

- [nodejs](https://nodejs.org/en/)
- [ganache](https://github.com/trufflesuite/ganache) or [anvil](https://book.getfoundry.sh/reference/anvil/) for local RPC node
- [truffle](https://trufflesuite.com/docs/truffle/quickstart/) 
- [nft.storage](https://nft.storage)
- [alchemy](https://dashboard.alchemy.com/)


## Website Demo

https://web-gui-spiritbro.vercel.app/

## Demo contract address

https://mumbai.polygonscan.com/address/0x05877184aB2ddAb0F9D1fa6c573392fCe7A7a74a


## Development

First you need to make sure you have install all the package run this command in your terminal :

```bash
$ cd .. # go back to the main repo, if you already in the main repo directory go to the next step
$ yarn
$ cd web-gui
$ yarn
```

Now run this command to run local RPC node:

```bash
$ anvil -p 7545
```

Go back to main folder,open new terminal and deploy our contract by running this command:

```bash
$ truffle migrate --network development
```

Now copy paste the contract address in `ethkvstore.address.json` into `env.development` in `web-gui` folder, it will look something like this, don't forget also add your nft.storage api key:

```
REACT_APP_NFT_STORAGE_API=<your nft.storage api key>
REACT_APP_CONTRACT=<your contract address>
REACT_APP_ALCHEMY_ID=<your alchemy ID>
REACT_APP_API_URL=<your API URL>
```

Now go inside web-gui folder and run:

```
$ yarn start
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

