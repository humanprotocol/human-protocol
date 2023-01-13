import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import store from 'store2';


class Storage {
  get(key: string) {
    return store.get(key);
  }

  set(key: string, data: any) {
    return store.set(key, data);
  }

  remove(key: string) {
    return store.remove(key)
  }
}

const storagePlugin: FastifyPluginAsync = async (server) => {
  server.decorate("storage", new Storage());
};

declare module "fastify" {
  interface FastifyInstance {
    storage: Storage;
  }
}

export default fp(storagePlugin);
