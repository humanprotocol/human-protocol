export interface INetwork {
  key: string;
  title: string;
  rpcUrl: string;
  scanner: string;
  chainName: string;
  graphqlClientUrl: string;
  defaultFactoryAddr: string;
  scannerUrl?: string;
  isDeprecated?: boolean;
}

export interface INetworkMap {
  [key: string]: INetwork;
}

export const networkMap: INetworkMap = {
  polygon: {
    title: 'Polygon Mainnet',
    key: 'polygon',
    scanner: 'https://polygonscan.com',
    chainName: 'Polygon Mainnet',
    rpcUrl: 'https://polygon-rpc.com/',
    defaultFactoryAddr: '0x45eBc3eAE6DA485097054ae10BA1A0f8e8c7f794',
    graphqlClientUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/polygon',
    scannerUrl: 'https://polygonscan.com/address/',
  },
  rinkeby: {
    title: 'Ethereum Rinkeby',
    chainName: 'Ethereum Rinkeby',
    key: 'rinkeby',
    scanner: 'https://rinkeby.etherscan.io',
    rpcUrl: 'https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    defaultFactoryAddr: '0x925B24444511c86F4d4E63141D8Be0A025E2dca4',
    graphqlClientUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/rinkeby',
    scannerUrl: 'https://rinkeby.etherscan.io/address/',
    isDeprecated: true,
  },
  mumbai: {
    title: 'Polygon Mumbai Testnet',
    chainName: 'Polygon Mumbai Testnet',
    key: 'mumbai',
    scanner: 'https://mumbai.polygonscan.com',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    defaultFactoryAddr: '0x558cd800f9F0B02f3B149667bDe003284c867E94',
    graphqlClientUrl: '',
  },
};

export const networks = Object.values(networkMap).map((network) => network);
