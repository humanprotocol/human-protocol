import "dotenv/config";
import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import Ajv from "ajv";
import BadWordsFilter from "bad-words";

const ajv = new Ajv({
  allErrors: true,
  removeAdditional: true,
  useDefaults: true,
  coerceTypes: true,
  allowUnionTypes: true,
});

const web3Plugin: FastifyPluginAsync = async (server) => {
  server.decorate("curses", new BadWordsFilter());
};

declare module "fastify" {
  interface FastifyInstance {
    curses: BadWordsFilter;
  }
}

export default fp(web3Plugin);
