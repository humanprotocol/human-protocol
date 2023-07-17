import { Test } from '@nestjs/testing';

import { MOCK_ADDRESS, MOCK_MANIFEST } from '../../../test/constants';
import { Web3Service } from '../web3/web3.service';
import { ManifestController } from './manifest.controller';
import { ManifestService } from './manifest.service';
import { ChainId } from '@human-protocol/sdk';

const OPERATOR_ADDRESS = 'TEST_OPERATOR_ADDRESS';

const signerMock = {
  address: OPERATOR_ADDRESS,
  getAddress: jest.fn().mockResolvedValue(OPERATOR_ADDRESS),
  getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
};

describe('ManifestController', () => {
  let manifestController: ManifestController;
  let manifestService: ManifestService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ManifestService,
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue(signerMock),
          },
        },
      ],
    }).compile();

    manifestService = moduleRef.get<ManifestService>(ManifestService);
    manifestController = new ManifestController(manifestService);
  });

  describe('Get Manifest', () => {
    it('should call service', async () => {
      jest
        .spyOn(manifestService, 'getManifest')
        .mockResolvedValue(MOCK_MANIFEST);

      expect(
        await manifestController.getManifest({
          chainId: ChainId.LOCALHOST,
          escrowAddress: MOCK_ADDRESS,
        }),
      ).toBe(MOCK_MANIFEST);
    });
  });
});
