import { describe, test, expect, beforeAll } from 'vitest';
import { ChainId, IEscrowNetwork } from "../../src/constants/networks.js";
import server from '../../src/server.js'

const privKey = 'df57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e';
const address = '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199';

describe('Web3 tests', () => {
  const {  web3 } = server;
  const network: IEscrowNetwork = {
    chainId: ChainId.LOCALHOST,
    factoryAddress: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
    hmtAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    rpcUrl: 'http://localhost:8546',
    title: 'Localhost'
  };
  test('Should initialize web3 client', async () => {
      const web3Client = web3.createWeb3(network, privKey);
      expect(web3Client.eth.defaultAccount).eq(address);
  });

});