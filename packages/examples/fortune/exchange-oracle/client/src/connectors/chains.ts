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

export const oktcTestnet: Chain = {
  id: 65,
  name: 'OKTC',
  network: 'oktc',
  nativeCurrency: {
    decimals: 18,
    name: 'OKT',
    symbol: 'OKT',
  },
  rpcUrls: {
    default: {
      http: ['https://exchaintestrpc.okex.org'],
    },
    public: {
      http: ['https://exchaintestrpc.okex.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'oklink',
      url: 'https://www.oklink.com/oktc-test',
    },
  },
};
