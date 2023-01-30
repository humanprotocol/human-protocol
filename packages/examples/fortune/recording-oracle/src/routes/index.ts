import { Type } from '@sinclair/typebox';
import { ChainId, ESCROW_NETWORKS } from '../constants/networks.js';
import { FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify';
import { ReplyDefault } from 'fastify/types/utils.js';
import { Server } from 'http';
import { processFortunes } from '../services/recordingOracle.js';
import { IPlugin } from '../interfaces/plugins.js';
import { IFortuneRequest } from '../interfaces/fortunes.js';

const bodySchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      fortune: { type: 'string', minLength: 2 },
      escrowAddress: { type: 'string', minLength: 2, pattern: '^0x[a-fA-F0-9]{40}$' },
      workerAddress: { type: 'string', minLength: 2, pattern: '^0x[a-fA-F0-9]{40}$' },
      chainId: { type: 'number', enum: Object.values(ChainId) },
    },
    required: ['fortune', 'escrowAddress', 'workerAddress', 'chainId']
  }
}

const opts = {
  schema: {
    body: bodySchema,
    response: {
      200: Type.Object({
        response: Type.Boolean()
      }),
    },
  }, 
}

const routes: FastifyPluginAsync = async (server: FastifyInstance<Server>) => {
  const { web3, s3, storage, escrow, curses, uniqueness } = server;

  const plugins: IPlugin = { 
    web3: {
      [ChainId.POLYGON]: web3.create(ESCROW_NETWORKS[ChainId.POLYGON]),
      [ChainId.POLYGON_MUMBAI]: web3.create(ESCROW_NETWORKS[ChainId.POLYGON_MUMBAI]),
      [ChainId.LOCALHOST]: web3.create(ESCROW_NETWORKS[ChainId.LOCALHOST])
    }, 
    s3, 
    storage,
    escrow,
    curses,
    uniqueness
  }

  server.post('/send-fortunes', opts,
    async function (request: FastifyRequest, reply: ReplyDefault) {
    
    const fortunes = request.body as IFortuneRequest[];

    return processFortunes(plugins, fortunes);
  });
}

export default routes;