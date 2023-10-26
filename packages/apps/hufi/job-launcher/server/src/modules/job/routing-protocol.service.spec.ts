import { Test } from '@nestjs/testing';

import { RoutingProtocolService } from './routing-protocol.service';
import { NETWORKS } from '@human-protocol/sdk';
import {
  MOCK_ADDRESS,
  MOCK_FILE_HASH,
  MOCK_FILE_KEY,
  MOCK_FILE_URL,
} from '../../../test/constants';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  EscrowClient: {
    build: jest.fn().mockImplementation(() => ({
      createAndSetupEscrow: jest.fn().mockResolvedValue(MOCK_ADDRESS),
    })),
  },
  StorageClient: jest.fn().mockImplementation(() => ({
    uploadFiles: jest
      .fn()
      .mockResolvedValue([
        { key: MOCK_FILE_KEY, url: MOCK_FILE_URL, hash: MOCK_FILE_HASH },
      ]),
  })),
}));

describe('RoutingProtocolService', () => {
  let routingProtocolService: RoutingProtocolService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [RoutingProtocolService],
    }).compile();

    routingProtocolService = moduleRef.get(RoutingProtocolService);
  });

  describe('selectNetwork', () => {
    it('should select network in random order', async () => {
      const chainIds = [];
      for (let i = 0; i < Object.keys(NETWORKS).length; i++) {
        chainIds.push(routingProtocolService.selectNetwork());
      }
      expect(chainIds).not.toEqual(Object.keys(NETWORKS));
    });

    it('should repeat first round network selection for the second round', async () => {
      const firstSelection = [];
      for (let i = 0; i < Object.keys(NETWORKS).length; i++) {
        firstSelection.push(routingProtocolService.selectNetwork());
      }
      const secondSelection = [];
      for (let i = 0; i < Object.keys(NETWORKS).length; i++) {
        secondSelection.push(routingProtocolService.selectNetwork());
      }
      expect(firstSelection).toEqual(secondSelection);
    });
  });
});
