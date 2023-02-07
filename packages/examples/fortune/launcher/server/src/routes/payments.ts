import { FastifyPluginAsync } from 'fastify';

export const cryptoPayment: FastifyPluginAsync = async (server) => {
  server.post(
    '/payment',
    {
      schema: {
        body: { type: 'string' },
      },
    },
    async function (request) {
      const txHash = request.body;

      // eslint-disable-next-line no-console
      console.log(txHash);

      return true;
    }
  );
};
