import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import EscrowAbi from '@human-protocol/core/abis/Escrow.json';
import Web3 from 'web3';

export class Escrow {
  async getRecordingOracleAddress(
    web3: Web3,
    escrowAddress: string
  ): Promise<string> {
    const Escrow = new web3.eth.Contract(EscrowAbi as [], escrowAddress);
    return await Escrow.methods.recordingOracle().call();
  }

  async getEscrowStatus(web3: Web3, escrowAddress: string): Promise<number> {
    const Escrow = new web3.eth.Contract(EscrowAbi as [], escrowAddress);
    return await Escrow.methods.status().call();
  }

  async getEscrowManifestUrl(
    web3: Web3,
    escrowAddress: string
  ): Promise<string> {
    const Escrow = new web3.eth.Contract(EscrowAbi as [], escrowAddress);
    return await Escrow.methods.manifestUrl().call();
  }

  async storeResults(
    web3: Web3,
    escrowAddress: string,
    workerAddress: string,
    resultsUrl: string,
    resultHash: string
  ) {
    const Escrow = new web3.eth.Contract(EscrowAbi as [], escrowAddress);
    const gasNeeded = await Escrow.methods
      .storeResults(resultsUrl, resultHash)
      .estimateGas({ from: web3.eth.defaultAccount });
    const gasPrice = await web3.eth.getGasPrice();

    const result = await Escrow.methods
      .storeResults(resultsUrl, resultHash)
      .send({ from: web3.eth.defaultAccount, gas: gasNeeded, gasPrice });

    return result;
  }
}

const escrowPlugin: FastifyPluginAsync = async (server) => {
  server.decorate('escrow', new Escrow());
};

declare module 'fastify' {
  interface FastifyInstance {
    escrow: Escrow;
  }
}

export default fp(escrowPlugin);
