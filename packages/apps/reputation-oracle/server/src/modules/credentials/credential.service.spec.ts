import { Test } from '@nestjs/testing';
import { CredentialService } from './credential.service';
import { CredentialRepository } from './credential.repository';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { createMock } from '@golevelup/ts-jest';
import { CredentialEntity } from './credential.entity';
import { MOCK_ADDRESS } from '../../../test/constants';
import { Web3Service } from '../web3/web3.service';
import { SelectQueryBuilder } from 'typeorm';
import { CredentialStatus } from '../../common/enums/credential';
import { CreateCredentialDto } from './credential.dto';
import { UserService } from '../user/user.service';
import { ControlledError } from '../../common/errors/controlled';
import { HttpStatus } from '@nestjs/common';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  EscrowClient: {
    build: jest.fn().mockImplementation(() => ({
      getReputationOracleAddress: jest.fn().mockResolvedValue('MOCK_ADDRESS'),
    })),
  },
  KVStoreClient: {
    build: jest.fn().mockImplementation(() => ({
      set: jest.fn(),
      get: jest.fn(),
    })),
  },
}));

describe('CredentialService', () => {
  let credentialService: CredentialService;
  let credentialRepository: CredentialRepository;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CredentialService,
        {
          provide: CredentialRepository,
          useValue: createMock<CredentialRepository>(),
        },
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue({ address: MOCK_ADDRESS }),
            signMessage: jest.fn(),
            prepareSignatureBody: jest.fn(),
          },
        },
        {
          provide: Web3ConfigService,
          useValue: createMock<Web3ConfigService>(),
        },
        {
          provide: UserService,
          useValue: createMock<UserService>(),
        },
      ],
    }).compile();

    credentialService = moduleRef.get<CredentialService>(CredentialService);
    credentialRepository = moduleRef.get(CredentialRepository);
  });

  describe('createCredential', () => {
    it('should create a new credential and return a credential entity', async () => {
      const startsAtDate = new Date('2024-05-12T13:48:35.938Z');
      const createCredentialDto: CreateCredentialDto = {
        reference: 'bbe5b21336ce',
        description: 'expertise skill',
        url: 'https://credentials-validator.com?credential_id=1',
        startsAt: startsAtDate,
      };

      const createdCredential = new CredentialEntity();
      createdCredential.reference = createCredentialDto.reference;
      createdCredential.description = createCredentialDto.description;
      createdCredential.url = createCredentialDto.url;
      createdCredential.startsAt = startsAtDate;
      createdCredential.status = CredentialStatus.ACTIVE;

      jest
        .spyOn(credentialRepository, 'createUnique')
        .mockResolvedValue(createdCredential);

      const result =
        await credentialService.createCredential(createdCredential);

      expect(credentialRepository.createUnique).toHaveBeenCalledWith(
        createdCredential,
      );

      expect(result).toMatchObject(createdCredential);
    });

    describe('getCredentials', () => {
      it('should return a list of credentials for a user', async () => {
        const credentials = [new CredentialEntity()];
        const mockQueryBuilder = {
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue(credentials),
        } as Partial<SelectQueryBuilder<CredentialEntity>>;

        jest
          .spyOn(credentialRepository, 'createQueryBuilder')
          .mockReturnValue(
            mockQueryBuilder as SelectQueryBuilder<CredentialEntity>,
          );

        const result = await credentialService.getCredentials(
          { id: 'user123' },
          'ACTIVE',
        );
        expect(result).toEqual(credentials);
      });
    });

    describe('getByReference', () => {
      it('should return a credential by reference', async () => {
        const credential = new CredentialEntity();
        jest
          .spyOn(credentialRepository, 'findByReference')
          .mockResolvedValue(credential);

        const result = await credentialService.getByReference('ref123');
        expect(result).toEqual(credential);
      });

      it('should return null if the credential is expired', async () => {
        const credential = { status: 'EXPIRED' } as CredentialEntity;
        jest
          .spyOn(credentialRepository, 'findByReference')
          .mockResolvedValue(credential);

        const result = await credentialService.getByReference('ref123');
        expect(result).toBeNull();
      });
    });

    describe('validateCredential', () => {
      it('should validate an active credential', async () => {
        const credential = { status: 'ACTIVE' } as CredentialEntity;
        jest
          .spyOn(credentialRepository, 'findByReference')
          .mockResolvedValue(credential);
        jest.spyOn(credentialRepository, 'save').mockResolvedValue(credential);

        await credentialService.validateCredential('ref123');
        expect(credential.status).toEqual('VALIDATED');
      });

      it('should throw an error if the credential is not found', async () => {
        jest
          .spyOn(credentialRepository, 'findByReference')
          .mockResolvedValue(null);
        await expect(
          credentialService.validateCredential('ref123'),
        ).rejects.toThrow(
          new ControlledError('Credential not found.', HttpStatus.BAD_REQUEST),
        );
      });
    });
  });
});
