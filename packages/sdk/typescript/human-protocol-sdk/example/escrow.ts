/* eslint-disable no-console */
import { NETWORKS } from '../src/constants';
import { ChainId } from '../src/enums';
import { EscrowUtils } from '../src/escrow';
import { EscrowStatus } from '../src/types';

export const getEscrows = async () => {
  if (!NETWORKS[ChainId.POLYGON_AMOY]) {
    return;
  }

  const escrows = await EscrowUtils.getEscrows({
    status: EscrowStatus.Pending,
    from: new Date(2023, 4, 8),
    to: new Date(2023, 5, 8),
    chainId: ChainId.POLYGON_AMOY,
  });

  console.log('Pending escrows:', escrows);
};

(async () => {
  getEscrows();
})();
