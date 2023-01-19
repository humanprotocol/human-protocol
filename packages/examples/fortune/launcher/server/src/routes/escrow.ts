import { Type } from '@sinclair/typebox';
import { FastifyPluginAsync } from 'fastify';
import { escrow as escrowSchema } from '../schemas/escrow.js';
import { ChainId, ESCROW_NETWORKS, IEscrowNetwork } from '../constants/networks.js';
import { launchEscrow } from '../services/escrowService.js'

export const createEscrow: FastifyPluginAsync = async (server) => {

  let escrowNetwork: IEscrowNetwork;
  let escrow: typeof escrowSchema.properties;
  server.post('/escrow',
    {
      preValidation: (request, reply, done) => {
        escrow = request.body as typeof escrowSchema.properties;
        const chainId = Number(escrow.chainId) as ChainId;
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
      const escrowAddress = await launchEscrow(escrowNetwork, escrow);
      return escrowAddress;
    });
  }