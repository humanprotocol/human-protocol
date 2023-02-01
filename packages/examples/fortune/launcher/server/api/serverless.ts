'use strict';

// Read the .env file.
import * as dotenv from 'dotenv';
import server from '../src/server.js';
dotenv.config();

server.listen({ port: 3000 }, (err) => {
  if (err) console.error(err);
  console.log('server listening on 3000');
});

export default async (req: any, res: any) => {
  await server.ready();
  server.server.emit('request', req, res);
};
