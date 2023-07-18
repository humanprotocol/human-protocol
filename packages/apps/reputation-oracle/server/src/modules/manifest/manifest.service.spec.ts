import { Test } from '@nestjs/testing';
import { ChainId, EscrowClient, StorageClient } from '@human-protocol/sdk';
import { ethers } from 'ethers';
import {
  MOCK_ADDRESS,
  MOCK_FILE_URL,
  MOCK_MANIFEST,
} from '../../../test/constants';
import { Web3Service } from '../web3/web3.service';
import { ManifestService } from './manifest.service';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  EscrowClient: {
    build: jest.fn(),
  },
  StorageClient: jest.fn().mockImplementation(() => ({
    uploadFiles: jest
      .fn()
      .mockResolvedValue([{ url: 'UPLOADED_URL', hash: 'UPLOADED_HASH' }]),
  })),
}));

describe('ManifestService', () => {
  let manifestService: ManifestService, mockSigner: any;

  const signerMock = {
    address: MOCK_ADDRESS,
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
  };

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

    const provider = new ethers.providers.JsonRpcProvider();
    mockSigner = {
      ...provider.getSigner(),
      getAddress: jest.fn().mockReturnValue(ethers.constants.AddressZero),
    };
  });

  describe('getManifest', () => {
    it('should return manifest data', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (EscrowClient.build as any).mockImplementation(() => ({
        getManifestUrl: jest.fn().mockResolvedValueOnce(MOCK_FILE_URL),
      }));

      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockResolvedValue(MOCK_MANIFEST);

      const manifest = await manifestService.getManifest(
        ChainId.LOCALHOST,
        MOCK_ADDRESS,
      );

      expect(manifest).toEqual(MOCK_MANIFEST);
    });

    it('should throw error when manifest url is not found', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (EscrowClient.build as any).mockImplementation(() => ({
        getManifestUrl: jest.fn().mockResolvedValueOnce(undefined),
      }));

      await expect(
        manifestService.getManifest(ChainId.LOCALHOST, MOCK_ADDRESS),
      ).rejects.toThrow('Manifest URL not found');
    });

    it('should throw error when manifest is not found', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (EscrowClient.build as any).mockImplementation(() => ({
        getManifestUrl: jest.fn().mockResolvedValueOnce(MOCK_FILE_URL),
      }));

      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockResolvedValue(undefined);

      await expect(
        manifestService.getManifest(ChainId.LOCALHOST, MOCK_ADDRESS),
      ).rejects.toThrow('Manifest not found');
    });
  });
});
