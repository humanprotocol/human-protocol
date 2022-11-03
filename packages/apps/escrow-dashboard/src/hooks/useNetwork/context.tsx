import React, { createContext, useState } from 'react';
import { networkMap, INetwork } from 'src/constants';

export const NetworkContext = createContext<{
  network: INetwork;
  networkId: string;
  switchNetwork: (id: string) => void;
} | null>(null);

export const NetworkProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [networkId, setNetworkId] = useState('polygon');

  const switchNetwork = (id: string) => setNetworkId(id);

  const network = networkMap[networkId];

  return (
    <NetworkContext.Provider value={{ network, networkId, switchNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
};
