'use strict';

// Read the .env file.
import * as dotenv from 'dotenv';
import server from './server.js';
dotenv.config();

// Require the framework
import Fastify from 'fastify';


export default async (req: any, res: any) => {
  await server.ready();
  server.server.emit('request', req, res);
};
