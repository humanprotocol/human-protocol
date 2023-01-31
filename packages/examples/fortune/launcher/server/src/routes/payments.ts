import { FastifyPluginAsync } from 'fastify';

export const cryptoPayment: FastifyPluginAsync = async (server) => {
  server.post(
    '/payment',
    {
      schema: {
        body: { type: 'string' },
      },
    },
    async function (request, reply) {
      const txHash = request.body;

      console.log(txHash);

      return true;
    }
  );
};
