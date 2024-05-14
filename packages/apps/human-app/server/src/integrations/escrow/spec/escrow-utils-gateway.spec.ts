import { Test, TestingModule } from '@nestjs/testing';
import { EscrowUtilsGateway } from '../escrow-utils-gateway.service';
import { EscrowUtils, ChainId } from '@human-protocol/sdk';
import { NotFoundException } from '@nestjs/common';

jest.mock('@human-protocol/sdk', () => {
  return {
    EscrowUtils: {
      getEscrow: jest.fn().mockResolvedValue({
        exchangeOracle: '0x',
      }),
    },
    ChainId: {
      POLYGON_AMOY: 1,
    },
  };
});

describe('EscrowUtilsGateway', () => {
  let service: EscrowUtilsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EscrowUtilsGateway],
    }).compile();

    service = module.get<EscrowUtilsGateway>(EscrowUtilsGateway);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getExchangeOracleAddressByEscrowAddress', () => {
    it('should fetch data from EscrowUtils', async () => {
      const escrowAddress = 'escrowAddress';
      const expectedUrl = '0x';

      const result = await service.getExchangeOracleAddressByEscrowAddress(
        ChainId.POLYGON_AMOY,
        escrowAddress,
      );
      expect(EscrowUtils.getEscrow).toHaveBeenCalledWith(
        ChainId.POLYGON_AMOY,
        escrowAddress,
      );
      expect(result).toBe(expectedUrl);
    });

    it('should throw error if Exchange Oracle not found', async () => {
      const escrowAddress = 'escrowAddress';

      (EscrowUtils.getEscrow as jest.Mock).mockResolvedValue({});

      await expect(
        service.getExchangeOracleAddressByEscrowAddress(
          ChainId.POLYGON_AMOY,
          escrowAddress,
        ),
      ).rejects.toThrow(new NotFoundException('Exchange Oracle not found'));
    });
  });
});
