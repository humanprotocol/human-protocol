import { Contract, providers } from 'ethers';
import { useEffect, useState } from 'react';

import { useNetwork } from '../useNetwork';

const EscrowFactoryABI = require('src/contracts/EscrowFactoryABI.json');

export default function useEscrowCounter() {
  const { network } = useNetwork();
  const [escrowQty, setEscrowQty] = useState<number>();

  useEffect(() => {
    const fetchData = async (rpcUrl: string) => {
      const provider = new providers.JsonRpcProvider(rpcUrl);
      const contract = new Contract(
        network.defaultFactoryAddr,
        EscrowFactoryABI,
        provider
      );
      const escrowAmount = await contract.counter();
      setEscrowQty(Number(escrowAmount));
    };
    if (network && network.rpcUrl) {
      fetchData(network.rpcUrl);
    }
  }, [network]);

  return escrowQty;
}
