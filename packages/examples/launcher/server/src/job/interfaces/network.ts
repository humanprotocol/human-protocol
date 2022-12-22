import { BINANCE_NETWORK, BINANCE_TESTNET_NETWORK, CLASSIC_NETWORK, GOERLI_NETWORK, MATIC_NETWORK, MUMBAI_NETWORK } from "nestjs-ethers";
 import { Network } from '@ethersproject/providers';

 export interface INetworkDto {
   network: Network;
   title: string;
   key: string;
   scanner: string;
   rpcUrl: string;
   defaultFactoryAddr: string;
   defaultStakingAddress: string;
   defaultRewardPoolAddress: string;
   hmtAddress: string;
   graphqlClientUrl: string;
 }

 interface INetworkMapDto {
   [key: string]: INetworkDto;
 }

 export const networkMap: INetworkMapDto = {
   polygon: {
     network: MATIC_NETWORK,
     title: 'Polygon Mainnet',
     key: 'polygon',
     scanner: 'https://polygonscan.com',
     rpcUrl: 'https://polygon-rpc.com/',
     defaultFactoryAddr: '0x45eBc3eAE6DA485097054ae10BA1A0f8e8c7f794',
     defaultStakingAddress: '0x0000000000000000000000000000000000000000',
     defaultRewardPoolAddress: '0x0000000000000000000000000000000000000000',
     hmtAddress: '0xc748B2A084F8eFc47E086ccdDD9b7e67aEb571BF',
     graphqlClientUrl:
       'https://api.thegraph.com/subgraphs/name/humanprotocol/polygon',
   },
   bsc: {
     network: BINANCE_NETWORK,
     title: 'Binance Smart Chain Mainnet',
     key: 'bsc',
     scanner: 'https://bscscan.com',
     rpcUrl: 'https://bsc-dataseed1.binance.org/',
     defaultFactoryAddr: '0xc88bC422cAAb2ac8812de03176402dbcA09533f4',
     defaultStakingAddress: '0x0000000000000000000000000000000000000000',
     defaultRewardPoolAddress: '0x0000000000000000000000000000000000000000',
     hmtAddress: '0x0d501B743F22b641B8C8dfe00F1AAb881D57DDC7',
     graphqlClientUrl:
       'https://api.thegraph.com/subgraphs/name/humanprotocol/bsc',
   },
   mumbai: {
     network: MUMBAI_NETWORK,
     title: 'Polygon Mumbai Testnet',
     key: 'mumbai',
     scanner: 'https://mumbai.polygonscan.com',
     rpcUrl: 'https://rpc-mumbai.maticvigil.com',
     defaultFactoryAddr: '0x79aE9b3Ad106AEdc1F813AaD98f550FADd9e2254',
     defaultStakingAddress: '0x1fA701df2bb75f2cE8B6439669BD1eCfCf8b26fe',
     defaultRewardPoolAddress: '0x138986B8dF6086a4adcDdDA490EEf7Fd5CB140A2',
     hmtAddress: '0x70e56f184e34691c019124f1252cb3bdf9d6c3d3',
     graphqlClientUrl:
       'https://api.thegraph.com/subgraphs/name/humanprotocol/mumbai',
   },
   goerli: {
     network: GOERLI_NETWORK,
     title: 'Ethereum Goerli',
     key: 'goerli',
     scanner: 'https://goerli.etherscan.io',
     rpcUrl: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
     defaultFactoryAddr: '0xaAe6a2646C1F88763E62e0cD08aD050Ea66AC46F',
     defaultStakingAddress: '0x0000000000000000000000000000000000000000',
     defaultRewardPoolAddress: '0x0000000000000000000000000000000000000000',
     hmtAddress: '0xd3A31D57FDD790725d0F6B78095F62E8CD4ab317',
     graphqlClientUrl:
       'https://api.thegraph.com/subgraphs/name/humanprotocol/goerli',
   },
   moonbeam: {
     network: CLASSIC_NETWORK,
     title: 'Moonbeam Mainnet',
     key: 'moonbeam',
     scanner: 'https://moonbeam.moonscan.io',
     rpcUrl: 'https://rpc.api.moonbeam.network',
     defaultFactoryAddr: '0x98108c28B7767a52BE38B4860832dd4e11A7ecad',
     defaultStakingAddress: '0x0000000000000000000000000000000000000000',
     defaultRewardPoolAddress: '0x0000000000000000000000000000000000000000',
     hmtAddress: '0x3b25BC1dC591D24d60560d0135D6750A561D4764',
     graphqlClientUrl:
       'https://api.thegraph.com/subgraphs/name/humanprotocol/moonbeam',
   },
   bsctest: {
     network: BINANCE_TESTNET_NETWORK,
     title: 'Binance Smart Chain Testnet',
     key: 'bsctest',
     scanner: 'https://testnet.bscscan.com',
     rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
     defaultFactoryAddr: '0xaae6a2646c1f88763e62e0cd08ad050ea66ac46f',
     defaultStakingAddress: '0x0000000000000000000000000000000000000000',
     defaultRewardPoolAddress: '0x0000000000000000000000000000000000000000',
     hmtAddress: '0xd3a31d57fdd790725d0f6b78095f62e8cd4ab317',
     graphqlClientUrl:
       'https://api.thegraph.com/subgraphs/name/humanprotocol/bsctest',
   },
 };
 
 export const networks = Object.values(networkMap).map((network) => network);