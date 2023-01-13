import { Type } from '@sinclair/typebox';
import { FastifyPluginAsync } from 'fastify';
import { sendFortunes } from '../services/index.js';

const bodySchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      fortune: { type: 'string', minLength: 2 },
      escrowAddress: { type: 'string', minLength: 2, pattern: '^0x[a-fA-F0-9]{40}$' },
      workerAddress: { type: 'string', minLength: 2, pattern: '^0x[a-fA-F0-9]{40}$' },
    },
    required: ['fortune', 'escrowAddress', 'workerAddress']
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

const routes: FastifyPluginAsync = async (server) => {
  const { web3, s3, storage } = server;
  server.post('/send-fortunes', opts,
   async function (request, reply) {
    
    const fortunes = request.body;

    return sendFortunes(fortunes);
  });
}

export default routes;