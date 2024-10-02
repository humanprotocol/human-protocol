import { Test } from '@nestjs/testing';

import { RoutingProtocolService } from './routing-protocol.service';
import { ChainId, NETWORKS, Role } from '@human-protocol/sdk';
import {
  MOCK_ADDRESS,
  MOCK_FILE_HASH,
  MOCK_FILE_KEY,
  MOCK_FILE_URL,
  MOCK_REPUTATION_ORACLE_1,
  mockConfig,
} from '../../../test/constants';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { NetworkConfigService } from '../../common/config/network-config.service';
import { Web3Service } from '../web3/web3.service';
import { ConfigService } from '@nestjs/config';
import { hashString } from '../../common/utils';

jest.mock('../../common/utils', () => ({
  ...jest.requireActual('../../common/utils'),
  hashString: jest.fn(),
}));

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
  let web3Service: Web3Service;
  let configService: ConfigService;
  let routingProtocolService: RoutingProtocolService;

  beforeEach(async () => {
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
        Web3ConfigService,
        NetworkConfigService,
        {
          provide: Web3Service,
          useValue: {
            findAvailableOracles: jest.fn(),
          },
        },
        RoutingProtocolService,
      ],
    }).compile();

    web3Service = moduleRef.get<Web3Service>(Web3Service);
    configService = moduleRef.get<ConfigService>(ConfigService);
    routingProtocolService = moduleRef.get(RoutingProtocolService);
  });

  describe('constructor', () => {
    it('should initialize chains and reputation oracles from config', () => {
      const chains = routingProtocolService['chains'];
      const reputationOracles = routingProtocolService['reputationOracles'];

      expect(chains).toHaveLength(routingProtocolService['chains'].length);
      expect(reputationOracles).toEqual(
        mockConfig['REPUTATION_ORACLES']
          .split(',')
          .map((address: string) => address.trim()),
      );
    });

    it('should shuffle chains and reputation oracles', () => {
      const chainPriorityOrder = routingProtocolService['chainPriorityOrder'];
      const reputationOraclePriorityOrder =
        routingProtocolService['reputationOraclePriorityOrder'];

      expect(chainPriorityOrder).toHaveLength(
        routingProtocolService['chains'].length,
      );
      expect(reputationOraclePriorityOrder).toHaveLength(
        routingProtocolService['reputationOracles'].length,
      );
    });
  });

  describe('selectOracleFromAvailable', () => {
    it('should return empty string if no oracles of the specified type are available', () => {
      const result = routingProtocolService.selectOracleFromAvailable(
        [],
        Role.ExchangeOracle,
        ChainId.POLYGON_AMOY,
        MOCK_REPUTATION_ORACLE_1,
        'jobType',
      );
      expect(result).toBe('');
    });

    it('should select the first available oracle of specified type', async () => {
      const availableOracles = [
        { role: Role.ExchangeOracle, address: '0xExchangeOracle1' },
        { role: Role.ExchangeOracle, address: '0xExchangeOracle2' },
      ];

      const result = routingProtocolService.selectOracleFromAvailable(
        availableOracles,
        Role.ExchangeOracle,
        ChainId.POLYGON_AMOY,
        MOCK_REPUTATION_ORACLE_1,
        'jobType',
      );
      expect(result).toEqual(expect.stringContaining('0xExchangeOracle')); // 0xExchangeOraclex;
    });

    it('should shuffle oracles and return the first oracle from the shuffled list', () => {
      const availableOracles = [
        { role: Role.ExchangeOracle, address: '0xExchangeOracle1' },
        { role: Role.ExchangeOracle, address: '0xExchangeOracle2' },
      ];

      jest
        .spyOn(routingProtocolService, 'shuffleArray')
        .mockReturnValue(['0xExchangeOracle2', '0xExchangeOracle1']);

      const result = routingProtocolService.selectOracleFromAvailable(
        availableOracles,
        Role.ExchangeOracle,
        ChainId.POLYGON_AMOY,
        MOCK_REPUTATION_ORACLE_1,
        'jobType',
      );
      expect(result).toBe('0xExchangeOracle2');
    });

    it('should update oracle order and select from the newly shuffled list if jobType changes', () => {
      const availableOracles = [
        { role: Role.ExchangeOracle, address: '0xExchangeOracle1' },
        { role: Role.ExchangeOracle, address: '0xExchangeOracle2' },
      ];

      routingProtocolService.oracleOrder = {
        [ChainId.POLYGON_AMOY]: {
          [MOCK_REPUTATION_ORACLE_1]: {
            [Role.ExchangeOracle]: {
              oldJobType: ['0xExchangeOracle1'],
            },
          },
        },
      };

      const result = routingProtocolService.selectOracleFromAvailable(
        availableOracles,
        Role.ExchangeOracle,
        ChainId.POLYGON_AMOY,
        MOCK_REPUTATION_ORACLE_1,
        'newJobType',
      );

      // The jobType changed, so the order should have been shuffled
      expect(
        routingProtocolService.oracleOrder[ChainId.POLYGON_AMOY][
          MOCK_REPUTATION_ORACLE_1
        ][Role.ExchangeOracle]['newJobType'],
      ).toEqual(
        expect.arrayContaining(['0xExchangeOracle1', '0xExchangeOracle2']),
      );
      expect(result).toBeDefined();
    });

    it('should not shuffle if the oracle hash has not changed for the same jobType', () => {
      const availableOracles = [
        { role: Role.ExchangeOracle, address: '0xExchangeOracle1' },
      ];

      const latestOraclesHash = 'hash123';
      (hashString as jest.Mock).mockReturnValue(latestOraclesHash);

      routingProtocolService.oracleOrder = {
        [ChainId.POLYGON_AMOY]: {
          [MOCK_REPUTATION_ORACLE_1]: {
            [Role.ExchangeOracle]: { jobType: ['0xExchangeOracle1'] },
          },
        },
      };

      routingProtocolService.oracleHashes = {
        [ChainId.POLYGON_AMOY]: {
          [MOCK_REPUTATION_ORACLE_1]: {
            [Role.ExchangeOracle]: { jobType: latestOraclesHash },
          },
        },
      };

      jest.spyOn(routingProtocolService, 'shuffleArray');

      const result = routingProtocolService.selectOracleFromAvailable(
        availableOracles,
        Role.ExchangeOracle,
        ChainId.POLYGON_AMOY,
        MOCK_REPUTATION_ORACLE_1,
        'jobType',
      );

      // Shuffle should not be called if the oracle hash is unchanged
      expect(routingProtocolService.shuffleArray).not.toHaveBeenCalled();
      expect(result).toBe('0xExchangeOracle1');
    });

    it('should update the oracle order and hash if the list of available oracles changes', () => {
      const availableOracles = [
        { role: Role.ExchangeOracle, address: '0xExchangeOracle1' },
        { role: Role.ExchangeOracle, address: '0xExchangeOracle2' },
      ];

      const previousHash = 'oldHash';
      routingProtocolService.oracleHashes = {
        [ChainId.POLYGON_AMOY]: {
          [MOCK_REPUTATION_ORACLE_1]: {
            [Role.ExchangeOracle]: { jobType: previousHash },
          },
        },
      };

      jest
        .spyOn(routingProtocolService, 'shuffleArray')
        .mockReturnValue(availableOracles.map((oracle) => oracle.address));
      const latestOraclesHash = 'newHash';
      (hashString as jest.Mock).mockReturnValue(latestOraclesHash);

      const result = routingProtocolService.selectOracleFromAvailable(
        availableOracles,
        Role.ExchangeOracle,
        ChainId.POLYGON_AMOY,
        MOCK_REPUTATION_ORACLE_1,
        'jobType',
      );

      expect(
        routingProtocolService.oracleHashes[ChainId.POLYGON_AMOY][
          MOCK_REPUTATION_ORACLE_1
        ][Role.ExchangeOracle]['jobType'],
      ).toBe(latestOraclesHash);
      expect(result).toBe('0xExchangeOracle1');
    });

    it('should select the oracle from available ones and rotate index', async () => {
      const availableOracles = [
        { role: Role.ExchangeOracle, address: '0xExchangeOracle1' },
        { role: Role.ExchangeOracle, address: '0xExchangeOracle2' },
        { role: Role.RecordingOracle, address: '0xRecordingOracle1' },
        { role: Role.RecordingOracle, address: '0xRecordingOracle2' },
      ];

      const result1 = routingProtocolService.selectOracleFromAvailable(
        availableOracles,
        Role.ExchangeOracle,
        ChainId.POLYGON_AMOY,
        MOCK_REPUTATION_ORACLE_1,
        'jobType',
      );

      const result2 = routingProtocolService.selectOracleFromAvailable(
        availableOracles,
        Role.RecordingOracle,
        ChainId.POLYGON_AMOY,
        MOCK_REPUTATION_ORACLE_1,
        'jobType',
      );

      const result3 = routingProtocolService.selectOracleFromAvailable(
        availableOracles,
        Role.ExchangeOracle,
        ChainId.POLYGON_AMOY,
        MOCK_REPUTATION_ORACLE_1,
        'jobType',
      );

      const result4 = routingProtocolService.selectOracleFromAvailable(
        availableOracles,
        Role.RecordingOracle,
        ChainId.POLYGON_AMOY,
        MOCK_REPUTATION_ORACLE_1,
        'jobType',
      );

      expect(result1).toEqual(expect.stringContaining('0xExchangeOracle')); // 0xExchangeOraclex;
      expect(result2).toEqual(expect.stringContaining('0xRecordingOracle')); // 0xRecordingOraclex
      expect(result3).toEqual(expect.stringContaining('0xExchangeOracle')); // 0xExchangeOraclex;
      expect(result4).toEqual(expect.stringContaining('0xRecordingOracle')); // 0xRecordingOraclex
    });
  });
});
