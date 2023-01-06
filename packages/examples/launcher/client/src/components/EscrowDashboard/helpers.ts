import { networks } from '../WalletConnector/chainParams';

export const netCompare = ({ network }: { network: string }) =>
  `0x${Number(window.ethereum.networkVersion).toString(16)}` !==
  networks[network].chainId;

export const formatHexToNumber = ({
  hex,
  radix,
}: {
  hex: string;
  radix: number;
}): number => parseInt(hex, radix);
