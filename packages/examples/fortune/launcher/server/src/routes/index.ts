import { FastifyInstance } from 'fastify';
import { createEscrow } from './escrow.js';
import { cryptoPayment } from './payments.js';

export default async function routes(fastify: FastifyInstance) {
  fastify.register(createEscrow);
  fastify.register(cryptoPayment);
}
