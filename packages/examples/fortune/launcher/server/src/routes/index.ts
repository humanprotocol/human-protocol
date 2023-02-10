import { FastifyInstance } from 'fastify';
import { createEscrow } from './escrow';
import { cryptoPayment } from './payments';

export default async function routes(fastify: FastifyInstance) {
  fastify.register(createEscrow);
  fastify.register(cryptoPayment);
}
