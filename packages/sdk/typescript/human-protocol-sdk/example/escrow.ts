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
    status: [EscrowStatus.Pending, EscrowStatus.Complete],
    chainId: ChainId.POLYGON_AMOY,
    first: 1000,
  });

  console.log('Pending escrows:', escrows.length);
};

(async () => {
  getEscrows();
})();
