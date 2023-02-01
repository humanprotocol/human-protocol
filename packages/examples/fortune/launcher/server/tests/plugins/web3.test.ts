import { describe, test, expect } from 'vitest';
import {
  ChainId,
  ESCROW_NETWORKS,
  IEscrowNetwork,
} from '../../src/constants/networks';
import getServer from '../../src/server';

const privKey =
  'df57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e';
const address = '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199';

describe('Web3 tests', async () => {
  const server = await getServer();
  const { web3 } = server;
  const network = ESCROW_NETWORKS[ChainId.LOCALHOST] as IEscrowNetwork;
  test('Should initialize web3 client', async () => {
    const web3Client = web3.createWeb3(network, privKey);
    expect(web3Client.eth.defaultAccount).eq(address);
  });
});
