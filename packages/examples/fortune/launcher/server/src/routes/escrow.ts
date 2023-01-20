import { Type } from '@sinclair/typebox';
import { FastifyPluginAsync } from 'fastify';
import { escrow as escrowSchema } from '../schemas/escrow.js';
import { ChainId, ESCROW_NETWORKS, IEscrowNetwork } from '../constants/networks.js';

export const createEscrow: FastifyPluginAsync = async (server) => {

  let escrowNetwork: IEscrowNetwork;
  let escrowData: typeof escrowSchema.properties;
  server.post('/escrow',
    {
      preValidation: (request, reply, done) => {
        escrowData = request.body as typeof escrowSchema.properties;
        const chainId = Number(escrowData.chainId) as ChainId;
        if (!chainId)
          return new Error('Invalid chain Id');
        
        const network = ESCROW_NETWORKS[chainId];
        if(network){
          escrowNetwork = network;
          done(undefined);
        }
        else
          done(new Error('Chain Id not supported'));
      },
      schema: {
        body: escrowSchema,
        response: {
          200: Type.Object({
            response: Type.String()
          }),
        },
      }, 
    },
    async function (request, reply) {
      const { escrow, s3, web3 } = server;

      const web3Client = web3.createWeb3(escrowNetwork);

      const jobRequester = escrowData.jobRequester as unknown as string;
      const token = escrowData.token as unknown as string;
      const fundAmount = web3Client.utils.toWei(Number(escrowData.fundAmount).toString(), 'ether');

      if (await escrow.checkApproved(web3Client, token, jobRequester, fundAmount)) {
        const escrowAddress = await escrow.createEscrow(web3Client, escrowNetwork.factoryAddress, jobRequester);
        await escrow.fundEscrow(web3Client, token, jobRequester, escrowAddress, fundAmount);
        const url = await s3.uploadManifest(escrowData, escrowAddress);
        await escrow.setupEscrow(web3Client, escrowAddress, escrowData, url);
        return escrowAddress;
      }

      return 'Balance or allowance not enough for funding the escrow';
    });
  }