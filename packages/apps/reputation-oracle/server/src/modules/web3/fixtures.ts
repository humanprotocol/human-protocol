import { faker } from '@faker-js/faker';
import {
  Web3ConfigService,
  Web3Network,
} from '../../config/web3-config.service';
import { generateEthWallet } from '../../../test/fixtures/web3';
import { supportedChainIdsByNetwork } from './web3.service';

const testWallet = generateEthWallet();

export function generateTestnetChainId() {
  return faker.helpers.arrayElement(
    supportedChainIdsByNetwork[Web3Network.TESTNET],
  );
}

export const mockWeb3ConfigService: Omit<Web3ConfigService, 'configService'> = {
  privateKey: testWallet.privateKey,
  operatorAddress: testWallet.address,
  network: Web3Network.TESTNET,
  gasPriceMultiplier: faker.number.int({ min: 1, max: 42 }),
  reputationNetworkChainId: generateTestnetChainId(),
  getRpcUrlByChainId: () => faker.internet.url(),
};
