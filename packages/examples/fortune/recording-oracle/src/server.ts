import fastify from 'fastify';
import config from './plugins/config';
import s3 from './plugins/s3';
import routes from './routes/index';
import cors from '@fastify/cors';
import escrow from './plugins/escrow';
import web3 from './plugins/web3';
import storage from './plugins/storage';
import curses from './plugins/curses';
import uniqueness from './plugins/uniqueness';

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
    .register(web3)
    .register(escrow)
    .register(s3)
    .register(storage)
    .register(curses)
    .register(uniqueness)
    .register(cors)
    .register(routes)
    .ready();

  return server;
};
export default getServer;
