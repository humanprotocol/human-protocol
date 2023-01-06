import * as React from 'react';
import { networkMap } from '../../constants';
import { AppNetworkContext } from '../App/AppNetworkContext';

export const useOnNetworkChange = () => {
  const { network, setNetwork } = React.useContext(AppNetworkContext);
  const [scannerUrl, setScannerUrl] = React.useState<string>('');
  const [escrowFactory, setEscrowFactory] = React.useState<string>(
    networkMap[network].defaultFactoryAddr
  );

  const onNetworkChange = React.useCallback(
    (networkKey: string) => {
      const validKey = networkKey.replace(/\W/g, '');
      setNetwork(validKey);
      setEscrowFactory(networkMap[network].defaultFactoryAddr);
      setScannerUrl('');
    },
    [network, setNetwork]
  );

  return {
    setEscrowFactory,
    onNetworkChange,
    setScannerUrl,
    escrowFactory,
    scannerUrl,
    network,
  };
};
