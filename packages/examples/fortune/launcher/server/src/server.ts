import fastify from 'fastify';
import config from './plugins/config.js';
import s3 from './plugins/s3.js'
import routes from './routes/index.js';
import cors from '@fastify/cors'
import escrow from './plugins/escrow.js';
import web3 from './plugins/web3.js';

const server = fastify({
  ajv: {
    customOptions: {
      removeAdditional: "all",
      coerceTypes: true,
      useDefaults: true,
    }
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
  .ready();

export default server;