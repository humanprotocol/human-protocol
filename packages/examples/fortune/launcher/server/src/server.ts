import fastify from 'fastify';
import config from './plugins/config.js';
// import web3 from './plugins/web3.js';
// import s3 from './plugins/s3.js'
// import storage from './plugins/storage.js';
import routes from './routes/index.js';
import cors from '@fastify/cors'

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
//   .register(web3)
//   .register(s3)
//   .register(storage)
  .register(cors)
  .register(routes)
  .ready();

export default server;