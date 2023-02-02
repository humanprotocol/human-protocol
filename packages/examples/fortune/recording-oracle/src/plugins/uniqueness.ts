import "dotenv/config";
import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import Ajv from "ajv";

const ajv = new Ajv({
  allErrors: true,
  removeAdditional: true,
  useDefaults: true,
  coerceTypes: true,
  allowUnionTypes: true,
});

export class Uniqueness {
    isUnique (test: string, set: string[]) {
      let unique = true;

      for (const item of set) {
        if (test.indexOf(item) > -1) {
          unique = false;
          break;
        }
      }
      
      return unique;
    }
  }

const web3Plugin: FastifyPluginAsync = async (server) => {
  server.decorate("uniqueness", new Uniqueness());
};

declare module "fastify" {
  interface FastifyInstance {
    uniqueness: Uniqueness;
  }
}

export default fp(web3Plugin);
