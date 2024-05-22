import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import {
  foundry,
  goerli,
  mainnet,
  optimism,
  polygon,
  sepolia,
} from 'wagmi/chains';
import { mock } from 'wagmi/connectors';

const foundryMainnet = {
  ...mainnet,
  rpcUrls: foundry.rpcUrls,
};

export const testChains = [foundryMainnet, mainnet, goerli, optimism, polygon];

export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    mock({
      accounts: [
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
        '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      ],
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

const queryClient = new QueryClient();

export const Providers = ({ children }: { children: React.ReactNode }) => (
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  </WagmiProvider>
);
