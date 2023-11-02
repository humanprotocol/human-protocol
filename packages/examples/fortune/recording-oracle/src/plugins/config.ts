import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { Static, Type } from '@sinclair/typebox';
import Ajv from 'ajv';

export enum NodeEnv {
  development = 'development',
  test = 'test',
  production = 'production',
}

const ConfigSchema = Type.Strict(
  Type.Object({
    NODE_ENV: Type.Enum(NodeEnv),
    LOG_LEVEL: Type.String(),
    API_HOST: Type.String(),
    API_PORT: Type.String(),
  })
);

const ajv = new Ajv({
  allErrors: true,
  removeAdditional: true,
  useDefaults: true,
  coerceTypes: true,
  allowUnionTypes: true,
});

export type Config = Static<typeof ConfigSchema>;

const configPlugin: FastifyPluginAsync = async (server) => {
  const validate = ajv.compile(ConfigSchema);
  if (!validate(process.env)) {
    throw new Error(
      '.env file validation failed - ' +
        JSON.stringify(validate.errors, null, 2)
    );
  }

  const config: Config = {
    NODE_ENV: process.env.NODE_ENV as NodeEnv,
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    API_HOST: process.env.API_HOST || 'localhost',
    API_PORT: process.env.API_PORT || '3005',
  };

  server.decorate('config', config);
};

declare module 'fastify' {
  interface FastifyInstance {
    config: Config;
  }
}

export default fp(configPlugin);
