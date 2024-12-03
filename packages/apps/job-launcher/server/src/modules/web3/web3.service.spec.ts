import { ChainId, OperatorUtils, Role } from '@human-protocol/sdk';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { ErrorWeb3 } from '../../common/constants/errors';
import { Web3Env } from '../../common/enums/web3';
import { Web3Service } from './web3.service';
import {
  MOCK_ADDRESS,
  MOCK_EXCHANGE_ORACLE_URL,
  MOCK_RECORDING_ORACLE_URL,
  MOCK_REPUTATION_ORACLES,
  mockConfig,
} from './../../../test/constants';
import { NetworkConfigService } from '../../common/config/network-config.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { ControlledError } from '../../common/errors/controlled';
import { HttpStatus } from '@nestjs/common';
import { OracleDataDto } from './web3.dto';

jest.mock('@human-protocol/sdk', () => {
  const actualSdk = jest.requireActual('@human-protocol/sdk');
  return {
    ...actualSdk,
    OperatorUtils: {
      getReputationNetworkOperators: jest.fn(),
      getLeader: jest.fn(),
    },
  };
});

describe('Web3Service', () => {
  let configService: ConfigService;
  let web3Service: Web3Service;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => mockConfig[key]),
            getOrThrow: jest.fn((key: string) => {
              if (!mockConfig[key]) {
                throw new Error(`Configuration key "${key}" does not exist`);
              }
              return mockConfig[key];
            }),
          },
        },
        Web3Service,
        NetworkConfigService,
        Web3ConfigService,
      ],
    }).compile();

    web3Service = moduleRef.get<Web3Service>(Web3Service);
    configService = moduleRef.get<ConfigService>(ConfigService);
  });

  describe('constructor', () => {
    it('should throw an error if no valid networks are found', () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'WEB3_ENV') return Web3Env.MAINNET;
        return mockConfig[key];
      });

      expect(
        () =>
          new Web3Service(
            new Web3ConfigService(configService),
            new NetworkConfigService(configService),
          ),
      ).toThrow(
        new ControlledError(ErrorWeb3.NoValidNetworks, HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('getSigner', () => {
    it('should return a signer for a valid chainId on TESTNET', () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'WEB3_ENV') return Web3Env.TESTNET;
        return mockConfig[key];
      });
      const validChainId = ChainId.POLYGON_AMOY;

      const signer = web3Service.getSigner(validChainId);
      expect(signer).toBeDefined();
    });

    it('should throw invalid chain id provided for the testnet environment', () => {
      const invalidChainId = ChainId.POLYGON;

      expect(() => web3Service.getSigner(invalidChainId)).toThrow(
        new ControlledError(ErrorWeb3.InvalidChainId, HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('getOperatorAddress', () => {
    it('should get the operator address', () => {
      const operatorAddress = web3Service.getOperatorAddress();
      expect(operatorAddress).toBe(MOCK_ADDRESS);
    });
  });

  describe('calculateGasPrice', () => {
    it('should return gas price multiplied by the multiplier', async () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'GAS_PRICE_MULTIPLIER') return 1;
        return mockConfig[key];
      });
      const mockGasPrice = BigInt(1000000000);

      web3Service.getSigner = jest.fn().mockReturnValue({
        address: MOCK_ADDRESS,
        getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
        provider: {
          getFeeData: jest
            .fn()
            .mockResolvedValueOnce({ gasPrice: mockGasPrice }),
        },
      });

      const result = await web3Service.calculateGasPrice(ChainId.POLYGON_AMOY);
      expect(result).toBe(mockGasPrice * BigInt(1));
    });

    it('should throw an error if gasPrice is undefined', async () => {
      web3Service.getSigner = jest.fn().mockReturnValue({
        address: MOCK_ADDRESS,
        getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
        provider: {
          getFeeData: jest.fn().mockResolvedValueOnce({ gasPrice: undefined }),
        },
      });

      await expect(
        web3Service.calculateGasPrice(ChainId.POLYGON_AMOY),
      ).rejects.toThrow(
        new ControlledError(ErrorWeb3.GasPriceError, HttpStatus.CONFLICT),
      );
    });
  });

  describe('validateChainId', () => {
    it('should not throw an error for a valid chainId', () => {
      expect(() =>
        web3Service.validateChainId(ChainId.POLYGON_AMOY),
      ).not.toThrow();
    });

    it('should throw an error for an invalid chainId', () => {
      const invalidChainId = ChainId.POLYGON;
      expect(() => web3Service.validateChainId(invalidChainId)).toThrow(
        new ControlledError(ErrorWeb3.InvalidChainId, HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('getAvailableOracles', () => {
    it('should return available oracles with provided parameters', async () => {
      const chainId = ChainId.POLYGON_AMOY;
      const jobType = 'Points';
      const reputationOracleAddress = '0xReputationOracle';

      const expectedResult = {
        exchangeOracles: ['0xExchangeOracle1', '0xExchangeOracle2'],
        recordingOracles: ['0xRecordingOracle1', '0xRecordingOracle2'],
      };

      const mockOracles: OracleDataDto[] = [
        {
          address: '0xExchangeOracle1',
          role: Role.ExchangeOracle,
          url: MOCK_EXCHANGE_ORACLE_URL,
          jobTypes: [jobType],
        },
        {
          address: '0xExchangeOracle2',
          role: Role.ExchangeOracle,
          url: MOCK_EXCHANGE_ORACLE_URL,
          jobTypes: [jobType],
        },
        {
          address: '0xRecordingOracle1',
          role: Role.RecordingOracle,
          url: MOCK_RECORDING_ORACLE_URL,
          jobTypes: [jobType],
        },
        {
          address: '0xRecordingOracle2',
          role: Role.RecordingOracle,
          url: MOCK_RECORDING_ORACLE_URL,
          jobTypes: [jobType],
        },
      ];

      jest
        .spyOn(web3Service, 'findAvailableOracles')
        .mockResolvedValue(mockOracles);

      const result = await web3Service.getAvailableOracles(
        chainId,
        jobType,
        reputationOracleAddress,
      );

      expect(result).toEqual(expectedResult);
      expect(result.exchangeOracles).toEqual(
        expect.arrayContaining(['0xExchangeOracle1', '0xExchangeOracle2']),
      );
      expect(result.recordingOracles).toEqual(
        expect.arrayContaining(['0xRecordingOracle1', '0xRecordingOracle2']),
      );
    });
  });

  describe('filterOracles', () => {
    it('should return filtered oracles based on job types', () => {
      const jobType = 'Points';

      const mockOracles: OracleDataDto[] = [
        {
          address: '0xExchangeOracle1',
          role: Role.ExchangeOracle,
          url: MOCK_EXCHANGE_ORACLE_URL,
          jobTypes: [jobType],
        },
        {
          address: '0xRecordingOracle1',
          role: Role.RecordingOracle,
          url: MOCK_RECORDING_ORACLE_URL,
          jobTypes: [jobType],
        },
      ];

      const result = web3Service.filterOracles(mockOracles, jobType);

      expect(result).toEqual(mockOracles);
    });

    it('should return an empty array if no oracles match the job type', () => {
      const mockOracles: OracleDataDto[] = [
        {
          address: '0xExchangeOracle1',
          role: Role.ExchangeOracle,
          url: MOCK_EXCHANGE_ORACLE_URL,
          jobTypes: ['SomeJobType'],
        },
        {
          address: '0xRecordingOracle1',
          role: Role.RecordingOracle,
          url: MOCK_RECORDING_ORACLE_URL,
          jobTypes: ['SomeJobType'],
        },
      ];

      const jobType = 'Points';

      const result = web3Service.filterOracles(mockOracles, jobType);

      expect(result).toEqual([]);
    });

    it('should filter out oracles with invalid URLs', () => {
      const mockOracles: OracleDataDto[] = [
        {
          address: '0xRecordingOracle1',
          role: Role.RecordingOracle,
          url: MOCK_RECORDING_ORACLE_URL,
          jobTypes: ['Points'],
        },
        {
          address: '0xRecordingOracle2',
          role: Role.RecordingOracle,
          url: '',
          jobTypes: ['Points'],
        },
      ];

      const result = web3Service.filterOracles(mockOracles, 'Points');
      expect(result).toEqual([
        {
          address: '0xRecordingOracle1',
          role: Role.RecordingOracle,
          url: MOCK_RECORDING_ORACLE_URL,
          jobTypes: ['Points'],
        },
      ]);
    });

    it('should return all oracles if jobType is not provided', () => {
      const mockOracles: OracleDataDto[] = [
        {
          address: '0xRecordingOracle1',
          role: Role.RecordingOracle,
          url: MOCK_RECORDING_ORACLE_URL,
          jobTypes: ['Points'],
        },
        {
          address: '0xRecordingOracle2',
          role: Role.RecordingOracle,
          url: MOCK_RECORDING_ORACLE_URL,
          jobTypes: ['Points'],
        },
      ];

      const result = web3Service.filterOracles(mockOracles, '');
      expect(result).toEqual(mockOracles);
    });
  });

  describe('getReputationOraclesByJobType', () => {
    beforeEach(async () => {
      jest
        .spyOn(web3Service.web3ConfigService, 'reputationOracles', 'get')
        .mockReturnValue(MOCK_REPUTATION_ORACLES);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return matching oracle addresses based on job type', async () => {
      const mockLeader = {
        address: '0x0000000000000000000000000000000000000000',
        reputationNetworks: [
          '0x0000000000000000000000000000000000000001',
          '0x0000000000000000000000000000000000000002',
          '0x0000000000000000000000000000000000000003',
        ],
      };

      const mockLeader1 = {
        address: '0x0000000000000000000000000000000000000001',
        jobTypes: ['Points'],
      };
      const mockLeader2 = {
        address: '0x0000000000000000000000000000000000000002',
        jobTypes: ['Fortune'],
      };
      const mockLeader3 = {
        address: '0x0000000000000000000000000000000000000003',
        jobTypes: ['Points', 'Fortune'],
      };

      (OperatorUtils.getLeader as jest.Mock)
        .mockResolvedValueOnce(mockLeader)
        .mockResolvedValueOnce(mockLeader1)
        .mockResolvedValueOnce(mockLeader2)
        .mockResolvedValueOnce(mockLeader3);

      const result = await web3Service.getReputationOraclesByJobType(
        ChainId.POLYGON_AMOY,
        'Points',
      );

      expect(result).toEqual([
        '0x0000000000000000000000000000000000000001',
        '0x0000000000000000000000000000000000000003',
      ]);
      expect(OperatorUtils.getLeader).toHaveBeenCalledTimes(4);
    });

    it('should return an empty array if reputation networks not found for chain', async () => {
      const mockLeader = {
        address: '0x0000000000000000000000000000000000000000',
      };

      const mockLeader1 = {
        address: '0x0000000000000000000000000000000000000001',
        jobTypes: ['NewJobType1'],
      };
      const mockLeader2 = {
        address: '0x0000000000000000000000000000000000000002',
        jobTypes: ['NewJobType2'],
      };
      const mockLeader3 = {
        address: '0x0000000000000000000000000000000000000003',
        jobTypes: ['NewJobType3'],
      };

      (OperatorUtils.getLeader as jest.Mock)
        .mockResolvedValueOnce(mockLeader)
        .mockResolvedValueOnce(mockLeader1)
        .mockResolvedValueOnce(mockLeader2)
        .mockResolvedValueOnce(mockLeader3);

      const result = await web3Service.getReputationOraclesByJobType(
        ChainId.POLYGON_AMOY,
        'Points',
      );

      expect(result).toEqual([]);
      expect(OperatorUtils.getLeader).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array if no oracles match the job type', async () => {
      const mockLeader = {
        address: '0x0000000000000000000000000000000000000000',
        reputationNetworks: [
          '0x0000000000000000000000000000000000000001',
          '0x0000000000000000000000000000000000000002',
          '0x0000000000000000000000000000000000000003',
        ],
      };

      const mockLeader1 = {
        address: '0x0000000000000000000000000000000000000001',
        jobTypes: ['NewJobType1'],
      };
      const mockLeader2 = {
        address: '0x0000000000000000000000000000000000000002',
        jobTypes: ['NewJobType2'],
      };
      const mockLeader3 = {
        address: '0x0000000000000000000000000000000000000003',
        jobTypes: ['NewJobType3'],
      };

      (OperatorUtils.getLeader as jest.Mock)
        .mockResolvedValueOnce(mockLeader)
        .mockResolvedValueOnce(mockLeader1)
        .mockResolvedValueOnce(mockLeader2)
        .mockResolvedValueOnce(mockLeader3);

      const result = await web3Service.getReputationOraclesByJobType(
        ChainId.POLYGON_AMOY,
        'Points',
      );

      expect(result).toEqual([]);
      expect(OperatorUtils.getLeader).toHaveBeenCalledTimes(1);
    });

    it('should handle errors from getLeader and return an empty array', async () => {
      (OperatorUtils.getLeader as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to fetch leader'),
      );

      const result = await web3Service.getReputationOraclesByJobType(
        ChainId.POLYGON_AMOY,
        'Points',
      );

      expect(result).toEqual([]);
      expect(OperatorUtils.getLeader).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array if no reputation oracles are configured', async () => {
      jest
        .spyOn(web3Service.web3ConfigService, 'reputationOracles', 'get')
        .mockReturnValue('');

      const result = await web3Service.getReputationOraclesByJobType(
        ChainId.POLYGON_AMOY,
        'Points',
      );

      expect(result).toEqual([]);
      expect(OperatorUtils.getLeader).toHaveBeenCalledTimes(1);
    });
  });
});
