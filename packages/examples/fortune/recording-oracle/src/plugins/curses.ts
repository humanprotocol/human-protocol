import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { pipeline } from '@xenova/transformers';

let pipe =  pipeline('text-classification', 'Rishi-19/Profanity_Test2');

export class Curses {
  async isProfane(text: string) {
    const result = await (await pipe)(text);
    const profanity = result[0].find((res: { label: string; }) => res.label === "Profanity_detected");
    return (profanity && profanity.score > 0.5);
  }
}

const web3Plugin: FastifyPluginAsync = async (server) => {
  server.decorate('curses', new Curses());
};

declare module 'fastify' {
  interface FastifyInstance {
    curses: Curses;
  }
}

export default fp(web3Plugin);
