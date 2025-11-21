/* eslint-disable no-console */
import { NETWORKS } from '../src/constants';
import { ChainId } from '../src/enums';
import { EscrowUtils } from '../src/escrow';
import { EscrowStatus } from '../src/types';

export const getEscrows = async () => {
  if (!NETWORKS[ChainId.POLYGON_AMOY]) {
    return;
  }

  const escrows = await EscrowUtils.getEscrows(
    {
      status: [EscrowStatus.Pending, EscrowStatus.Complete],
      chainId: ChainId.POLYGON_AMOY,
      first: 10,
    },
    { indexerId: '0xbdfb5ee5a2abf4fc7bb1bd1221067aef7f9de491' }
  );

  console.log('Pending escrows:', escrows.length);
};

(async () => {
  getEscrows();
})();
