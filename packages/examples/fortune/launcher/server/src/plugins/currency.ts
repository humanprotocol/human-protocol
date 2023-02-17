import axios from 'axios';
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

export class Currency {
  async getHMTPrice(amount: number, currency: string) {
    const currentPrice = (
      await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=human-protocol&vs_currencies=${currency}`
      )
    ).data['human-protocol'][currency];
    return amount / currentPrice;
  }
}

const currencyPlugin: FastifyPluginAsync = async (server) => {
  server.decorate('currency', new Currency());
};

declare module 'fastify' {
  interface FastifyInstance {
    currency: Currency;
  }
}

export default fp(currencyPlugin);
