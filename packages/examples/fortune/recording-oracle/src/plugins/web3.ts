import 'dotenv/config';
import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import Web3 from 'web3';
import Ajv from 'ajv';
import { IEscrowNetwork } from '../interfaces/networks';

const ConfigSchema = Type.Strict(
  Type.Object({
    ETH_NODE_URL: Type.String(),
    ETH_PRIVATE_KEY: Type.String(),
  })
);

const ajv = new Ajv({
  allErrors: true,
  removeAdditional: true,
  useDefaults: true,
  coerceTypes: true,
  allowUnionTypes: true,
});

class Web3Client {
  private privKey = process.env.ETH_PRIVATE_KEY as string;

  create(network: IEscrowNetwork, privateKey?: string) {
    const ethHttpServer = network.rpcUrl as string;
    const web3 = new Web3(ethHttpServer);

    const account = web3.eth.accounts.privateKeyToAccount(
      `0x${privateKey || this.privKey}`
    );
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;

    return web3;
  }
}

const web3Plugin: FastifyPluginAsync = async (server) => {
  const validate = ajv.compile(ConfigSchema);
  const valid = validate(process.env);
  if (!valid) {
    throw new Error(
      '.env file validation failed - ' +
        JSON.stringify(validate.errors, null, 2)
    );
  }

  const web3 = new Web3(process.env.ETH_NODE_URL as string);
  const account = web3.eth.accounts.privateKeyToAccount(
    `0x${process.env.ETH_PRIVATE_KEY}`
  );

  web3.eth.accounts.wallet.add(account);
  web3.eth.defaultAccount = account.address;

  server.decorate('web3', new Web3Client());
};

declare module 'fastify' {
  interface FastifyInstance {
    web3: Web3Client;
  }
}

export default fp(web3Plugin);
