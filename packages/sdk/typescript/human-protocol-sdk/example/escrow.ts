/* eslint-disable no-console */
import { providers } from 'ethers';
import { EscrowClient } from '../src/escrow';
import { NETWORKS } from '../src/constants';
import { ChainId } from '../src/enums';
import { EscrowStatus } from '../src/types';

export const getEscrows = async () => {
  if (!NETWORKS[ChainId.POLYGON_MUMBAI]) {
    return;
  }

  const jsonRPCProvider = new providers.JsonRpcProvider();
  const escrowClient = new EscrowClient(
    jsonRPCProvider,
    NETWORKS[ChainId.POLYGON_MUMBAI]
  );

  const escrows = await escrowClient.getEscrows({
    status: EscrowStatus.Pending,
    from: new Date(2023, 4, 8),
    to: new Date(2023, 5, 8),
  });

  console.log('Pending escrows:', escrows);
};

(async () => {
  getEscrows();
})();
