import { describe, test, expect, beforeAll } from 'vitest';
import { ChainId, ESCROW_NETWORKS, IEscrowNetwork } from "../../src/constants/networks.js";
import server from '../../src/server.js'
import { stake, approve } from '../utils.js'

const jobRequesterPrivKey = '689af8efa8c651a91ad287602527f3af2fe9f6501a7ac4b061667b5a93e037fd';
const jobRequester = '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E';

describe('Escrow route tests', () => {
    const { escrow, web3 } = server;
    const network = ESCROW_NETWORKS[ChainId.LOCALHOST] as IEscrowNetwork;
    const web3Client = web3.createWeb3(network);
    const web3JobRequester = web3.createWeb3(network, jobRequesterPrivKey);
    beforeAll(async () => {
        await stake(web3Client, network);
    })

    test('Should not allow to create an escrow', async () => {
        const response = await server.inject({
        method: 'POST',
        path: '/escrow',
        payload: {
            chainId: 1338,
            title: "title 1",
            description: "description 1",
            fortunesRequired: 2,
            token: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
            fundAmount: 1,
            jobRequester: jobRequester
        }
    });
      
        expect(response.statusCode).eq(400);
        expect(response.body).eq('Balance or allowance not enough for funding the escrow');
  });
    test('Should create an escrow', async () => {
        const amount = web3JobRequester.utils.toWei('10', 'ether');
        await approve(web3JobRequester, network, web3Client.eth.defaultAccount as string, amount);
        const response = await server.inject({
        method: 'POST',
        path: '/escrow',
        payload: {
            chainId: 1338,
            title: "title 1",
            description: "description 1",
            fortunesRequired: 2,
            token: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
            fundAmount: 1,
            jobRequester: jobRequester
        }
    });
      
        expect(response.statusCode).eq(200);
        expect(response.body).contains('0x');
  });

  
});