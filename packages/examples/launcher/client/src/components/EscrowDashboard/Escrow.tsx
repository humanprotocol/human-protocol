import * as React from 'react';
import { INetwork } from '../../constants/networkConstants';

import { EscrowFactoryView } from './EscrowFactoryView';
import { useEscrowHook } from './hooks';

interface IEscrowContainer {
  network: INetwork;
}

export const Escrow: React.FC<IEscrowContainer> = ({
  network,
}): React.ReactElement => {
  const escrowData = useEscrowHook(network);

  return <EscrowFactoryView title={network.title} {...escrowData} />;
};
