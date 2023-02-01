'use strict';

// Read the .env file.
import * as dotenv from 'dotenv';
import server from '../src/server.js';
dotenv.config();

export default async (req: any, res: any) => {
  await server.ready();
  server.server.emit('request', req, res);
};
