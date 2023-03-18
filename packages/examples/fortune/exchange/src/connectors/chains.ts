import { Chain } from 'wagmi';

export const fortune: Chain = {
  id: 1338,
  name: 'Localhost',
  network: 'localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
    public: {
      http: ['http://127.0.0.1:8545'],
    },
  },
};

export const wagmiSkaleHP: Chain = {
  id: 1273227453,
  name: 'Skale Human Protocol chain',
  network: 'skale',
  nativeCurrency: {
    decimals: 18,
    name: 'Skale FUEL',
    symbol: 'sFUEL',
  },
  rpcUrls: {
    public: { http: ['https://mainnet.skalenodes.com/v1/wan-red-ain'] },
    default: { http: ['https://mainnet.skalenodes.com/v1/wan-red-ain'] },
  },
  blockExplorers: {
    default: {
      name: 'Skale Explorer',
      url: 'https://mainnet.skalenodes.com/v1/wan-red-ain',
    },
  },
};
