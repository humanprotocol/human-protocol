import fastify from 'fastify';
import config from './plugins/config';
import s3 from './plugins/s3';
import routes from './routes/index';
import cors from '@fastify/cors';
import escrow from './plugins/escrow';
import web3 from './plugins/web3';
import stripe from './plugins/stripe';
import currency from './plugins/currency';

const getServer = async () => {
  const server = fastify({
    ajv: {
      customOptions: {
        removeAdditional: 'all',
        coerceTypes: true,
        useDefaults: true,
      },
    },
    logger: {
      level: process.env.LOG_LEVEL,
    },
  });

  await server
    .register(config)
    .register(s3)
    .register(cors)
    .register(routes)
    .register(escrow)
    .register(web3)
    .register(stripe)
    .register(currency)
    .ready();

  return server;
};
export default getServer;
