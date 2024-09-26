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
import { Web3Service } from '../web3/web3.service';
import { ConfigService } from '@nestjs/config';
import { ControlledError } from '../../common/errors/controlled';
import { ErrorRoutingProtocol } from '../../common/constants/errors';
import { HttpStatus } from '@nestjs/common';

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

      expect(chains).toHaveLength(Object.keys(NETWORKS).length);
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

  describe('selectNetwork', () => {
    it('should select a network in a random order', () => {
      const chainIds = [];
      for (let i = 0; i < routingProtocolService['chains'].length; i++) {
        chainIds.push(routingProtocolService.selectNetwork());
      }
      expect(chainIds).toHaveLength(routingProtocolService['chains'].length);
    });

    it('should cycle back to the first network after cycling through all', () => {
      const firstCycle = routingProtocolService.selectNetwork();
      const chainLength = routingProtocolService['chains'].length;

      for (let i = 1; i < chainLength; i++) {
        routingProtocolService.selectNetwork();
      }

      const secondCycle = routingProtocolService.selectNetwork();
      expect(firstCycle).toBe(secondCycle);
    });
  });

  describe('selectReputationOracle', () => {
    it('should select a reputation oracle in shuffled order', () => {
      const selectedOracles = [];
      const oracleLength = routingProtocolService['reputationOracles'].length;

      for (let i = 0; i < oracleLength; i++) {
        selectedOracles.push(routingProtocolService.selectReputationOracle());
      }

      expect(selectedOracles).toHaveLength(oracleLength);
      expect(new Set(selectedOracles).size).toBe(oracleLength); // Ensure all oracles are unique
    });

    it('should cycle back to the first reputation oracle after cycling through all', () => {
      const firstCycle = routingProtocolService.selectReputationOracle();
      const oracleLength = routingProtocolService['reputationOracles'].length;

      for (let i = 1; i < oracleLength; i++) {
        routingProtocolService.selectReputationOracle();
      }

      const secondCycle = routingProtocolService.selectReputationOracle();
      expect(firstCycle).toBe(secondCycle);
    });
  });

  describe('selectOracleFromAvailable', () => {
    it('should return null if no oracles of specified type', async () => {
      const result = await routingProtocolService.selectOracleFromAvailable(
        [],
        Role.ExchangeOracle,
        ChainId.POLYGON_AMOY,
        MOCK_REPUTATION_ORACLE_1,
      );
      expect(result).toBeNull();
    });

    it('should select the first available oracle of specified type', async () => {
      const availableOracles = [
        { role: Role.ExchangeOracle, address: '0xExchangeOracle1' },
        { role: Role.ExchangeOracle, address: '0xExchangeOracle2' },
      ];

      const result = await routingProtocolService.selectOracleFromAvailable(
        availableOracles,
        Role.ExchangeOracle,
        ChainId.POLYGON_AMOY,
        MOCK_REPUTATION_ORACLE_1,
      );
      expect(result).toEqual(expect.stringContaining('0xExchangeOracle')); // 0xExchangeOraclex;
    });

    it('should shuffle oracle order if the oracle hash changes', async () => {
      const availableOracles = [
        { role: Role.ExchangeOracle, address: '0xExchangeOracle1' },
        { role: Role.ExchangeOracle, address: '0xExchangeOracle2' },
      ];

      const result1 = await routingProtocolService.selectOracleFromAvailable(
        availableOracles,
        Role.ExchangeOracle,
        ChainId.POLYGON_AMOY,
        MOCK_REPUTATION_ORACLE_1,
      );
      const result2 = await routingProtocolService.selectOracleFromAvailable(
        availableOracles,
        Role.ExchangeOracle,
        ChainId.POLYGON_AMOY,
        MOCK_REPUTATION_ORACLE_1,
      );

      expect(result1).not.toBe(result2); // Ensure that the order has been shuffled
    });

    it('should select the oracle from available ones and rotate index', async () => {
      const availableOracles = [
        { role: Role.ExchangeOracle, address: '0xExchangeOracle1' },
        { role: Role.ExchangeOracle, address: '0xExchangeOracle2' },
        { role: Role.RecordingOracle, address: '0xRecordingOracle1' },
        { role: Role.RecordingOracle, address: '0xRecordingOracle2' },
      ];

      const result1 = await routingProtocolService.selectOracleFromAvailable(
        availableOracles,
        Role.ExchangeOracle,
        ChainId.POLYGON_AMOY,
        MOCK_REPUTATION_ORACLE_1,
      );

      const result2 = await routingProtocolService.selectOracleFromAvailable(
        availableOracles,
        Role.RecordingOracle,
        ChainId.POLYGON_AMOY,
        MOCK_REPUTATION_ORACLE_1,
      );

      const result3 = await routingProtocolService.selectOracleFromAvailable(
        availableOracles,
        Role.ExchangeOracle,
        ChainId.POLYGON_AMOY,
        MOCK_REPUTATION_ORACLE_1,
      );

      const result4 = await routingProtocolService.selectOracleFromAvailable(
        availableOracles,
        Role.RecordingOracle,
        ChainId.POLYGON_AMOY,
        MOCK_REPUTATION_ORACLE_1,
      );

      expect(result1).toEqual(expect.stringContaining('0xExchangeOracle')); // 0xExchangeOraclex;
      expect(result2).toEqual(expect.stringContaining('0xRecordingOracle')); // 0xRecordingOraclex
      expect(result3).toEqual(expect.stringContaining('0xExchangeOracle')); // 0xExchangeOraclex;
      expect(result4).toEqual(expect.stringContaining('0xRecordingOracle')); // 0xRecordingOraclex
    });
  });

  describe('selectOracles', () => {
    it('should select reputation oracle and find available oracles', async () => {
      const mockAvailableOracles = [
        { role: Role.ExchangeOracle, address: '0xExchangeOracle1' },
        { role: Role.RecordingOracle, address: '0xRecordingOracle1' },
      ];

      web3Service.findAvailableOracles = jest
        .fn()
        .mockResolvedValue(mockAvailableOracles);

      const result = await routingProtocolService.selectOracles(
        ChainId.POLYGON_AMOY,
        'jobType',
      );
      expect(result.reputationOracle).toBeDefined();
      expect(result.exchangeOracle).toBe('0xExchangeOracle1');
      expect(result.recordingOracle).toBe('0xRecordingOracle1');
    });

    it('should return null for exchange and recording oracles if none available', async () => {
      web3Service.findAvailableOracles = jest.fn().mockResolvedValue([]);

      const result = await routingProtocolService.selectOracles(
        ChainId.POLYGON_AMOY,
        'jobType',
      );
      expect(result.exchangeOracle).toBeNull();
      expect(result.recordingOracle).toBeNull();
    });
  });

  describe('validateOracles', () => {
    it('should validate oracles successfully', async () => {
      const chainId = ChainId.POLYGON_AMOY;
      const jobType = 'someJobType';
      const reputationOracle = '0xReputationOracle';
      const exchangeOracle = '0xExchangeOracle';
      const recordingOracle = '0xRecordingOracle';

      jest
        .spyOn(
          routingProtocolService.web3ConfigService,
          'reputationOracles',
          'get',
        )
        .mockReturnValue(`${reputationOracle},otherOracle`);
      jest.spyOn(web3Service, 'findAvailableOracles').mockResolvedValue([
        { address: exchangeOracle, role: Role.ExchangeOracle },
        { address: recordingOracle, role: Role.RecordingOracle },
      ]);

      await expect(
        routingProtocolService.validateOracles(
          chainId,
          jobType,
          reputationOracle,
          exchangeOracle,
          recordingOracle,
        ),
      ).resolves.not.toThrow();
    });

    it('should throw error if reputation oracle not found', async () => {
      const chainId = ChainId.POLYGON_AMOY;
      const jobType = 'someJobType';
      const invalidReputationOracle = 'invalidOracle';

      jest
        .spyOn(
          routingProtocolService.web3ConfigService,
          'reputationOracles',
          'get',
        )
        .mockReturnValue('validReputationOracle,otherOracle');

      await expect(
        routingProtocolService.validateOracles(
          chainId,
          jobType,
          invalidReputationOracle,
        ),
      ).rejects.toThrow(
        new ControlledError(
          ErrorRoutingProtocol.ReputationOracleNotFound,
          HttpStatus.NOT_FOUND,
        ),
      );
    });

    it('should throw error if exchange oracle not found', async () => {
      const chainId = ChainId.POLYGON_AMOY;
      const jobType = 'someJobType';
      const reputationOracle = '0xReputationOracle';

      jest
        .spyOn(
          routingProtocolService.web3ConfigService,
          'reputationOracles',
          'get',
        )
        .mockReturnValue(reputationOracle);
      jest
        .spyOn(web3Service, 'findAvailableOracles')
        .mockResolvedValue([
          { address: 'anotherOracle', role: Role.ExchangeOracle },
        ]);

      await expect(
        routingProtocolService.validateOracles(
          chainId,
          jobType,
          reputationOracle,
          'invalidExchangeOracle',
        ),
      ).rejects.toThrow(
        new ControlledError(
          ErrorRoutingProtocol.ExchangeOracleNotFound,
          HttpStatus.NOT_FOUND,
        ),
      );
    });

    it('should throw error if recording oracle not found', async () => {
      const chainId = ChainId.POLYGON_AMOY;
      const jobType = 'someJobType';
      const reputationOracle = '0xReputationOracle';

      jest
        .spyOn(
          routingProtocolService.web3ConfigService,
          'reputationOracles',
          'get',
        )
        .mockReturnValue(reputationOracle);
      jest
        .spyOn(web3Service, 'findAvailableOracles')
        .mockResolvedValue([
          { address: 'anotherOracle', role: Role.RecordingOracle },
        ]);

      await expect(
        routingProtocolService.validateOracles(
          chainId,
          jobType,
          reputationOracle,
          undefined,
          'invalidRecordingOracle',
        ),
      ).rejects.toThrow(
        new ControlledError(
          ErrorRoutingProtocol.RecordingOracleNotFound,
          HttpStatus.NOT_FOUND,
        ),
      );
    });
  });
});
