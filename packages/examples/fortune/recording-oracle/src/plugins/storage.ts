import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import store from 'store2';
import { IEscrowStorage, IFortuneStorage } from '../interfaces/storage';

export class Storage {
  remove(key: string): boolean {
    return store.remove(key);
  }

  addEscrow(
    escrowAddress: string,
    chainId: number,
    fortunesRequested: number
  ): IEscrowStorage {
    const escrow = {
      chainId,
      fortunesRequested,
      fortunes: {},
    };

    store.set(escrowAddress, escrow);

    return escrow;
  }

  hasEscrow(escrowAddress: string): boolean {
    return store.has(escrowAddress);
  }

  getEscrow(escrowAddress: string): IEscrowStorage {
    return store.get(escrowAddress);
  }

  getFortunes(escrowAddress: string, workerAddress: string): IFortuneStorage[] {
    const escrow = store.get(escrowAddress);
    return escrow.fortunes[workerAddress];
  }

  hasFortune(escrowAddress: string, workerAddress: string): boolean {
    const escrow = store.get(escrowAddress);

    if (!escrow?.fortunes[workerAddress]) {
      return false;
    }

    return true;
  }

  addFortune(
    escrowAddress: string,
    workerAddress: string,
    fortune: string,
    score: boolean
  ): IEscrowStorage {
    const escrow = store.get(escrowAddress);

    if (!this.hasFortune(escrowAddress, workerAddress)) {
      escrow.fortunes[workerAddress] = [];
    }

    escrow.fortunes[workerAddress].unshift({
      fortune,
      score,
    });

    store.set(escrowAddress, escrow);
    return escrow;
  }
}

const storagePlugin: FastifyPluginAsync = async (server) => {
  server.decorate('storage', new Storage());
};

declare module 'fastify' {
  interface FastifyInstance {
    storage: Storage;
  }
}

export default fp(storagePlugin);
