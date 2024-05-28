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
import { UserType } from '../../common/enums/user';
import { UserService } from '../user/user.service';
import { verifySignature } from '../../common/utils/signature';
import { KVStoreClient } from '@human-protocol/sdk';
import { ChainId } from '@human-protocol/sdk';
import {
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UserRepository } from '../user/user.repository';

jest.mock('../../common/utils/signature', () => ({
  verifySignature: jest.fn(),
}));

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
  let userService: UserService;
  let userRepository: UserRepository;

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
    userService = moduleRef.get<UserService>(UserService);
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
        .spyOn(credentialRepository, 'save')
        .mockResolvedValue(createdCredential);

      const result =
        await credentialService.createCredential(createCredentialDto);

      expect(credentialRepository.save).toHaveBeenCalledWith(createdCredential);
      expect(result).toMatchObject(createdCredential);
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
      ).rejects.toThrow('Credential not found.');
    });
  });

  describe('addCredentialOnChain', () => {
    const mockCredential = new CredentialEntity();
    mockCredential.id = 1;
    mockCredential.reference = 'ref123';
    mockCredential.status = CredentialStatus.VALIDATED;

    it('should add a credential on-chain and update the status', async () => {
      jest
        .spyOn(credentialRepository, 'findOne')
        .mockResolvedValue(mockCredential);
      const mockKVStoreClient = {
        set: jest.fn().mockResolvedValue(undefined),
      };
      jest.spyOn(userService, 'prepareSignatureBody').mockResolvedValue({
        contents: 'signatureBodyContents',
        from: 'fromAddress',
        to: 'toAddress',
        nonce: 'nonceValue',
      });

      (verifySignature as jest.Mock).mockReturnValue(true);

      jest
        .spyOn(credentialRepository, 'save')
        .mockResolvedValue(mockCredential);

      KVStoreClient.build = jest.fn().mockResolvedValue(mockKVStoreClient);

      await credentialService.addCredentialOnChain(
        mockCredential.id,
        '0xWorkerAddress',
        'signature',
        ChainId.LOCALHOST,
        '0xEscrowAddress',
      );

      expect(credentialRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockCredential.id },
        relations: ['validator'],
      });
      expect(mockKVStoreClient.set).toHaveBeenCalledWith(
        `${mockCredential.reference}-MOCK_ADDRESS`,
        JSON.stringify({
          signature: 'signature',
          contents: 'signatureBodyContents',
        }),
      );
      expect(credentialRepository.save).toHaveBeenCalledWith({
        ...mockCredential,
        status: CredentialStatus.ON_CHAIN,
      });
    });

    it('should throw an error if the credential is not found', async () => {
      jest.spyOn(credentialRepository, 'findOne').mockResolvedValue(null);

      await expect(
        credentialService.addCredentialOnChain(
          1,
          '0xWorkerAddress',
          'signature',
          ChainId.LOCALHOST,
          '0xEscrowAddress',
        ),
      ).rejects.toThrow(
        new HttpException('Credential not found', HttpStatus.NOT_FOUND),
      );

      expect(credentialRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['validator'],
      });
    });

    it('should throw an error if the credential is not in a valid state for on-chain addition', async () => {
      mockCredential.status = CredentialStatus.ACTIVE;
      jest
        .spyOn(credentialRepository, 'findOne')
        .mockResolvedValue(mockCredential);

      await expect(
        credentialService.addCredentialOnChain(
          1,
          '0xWorkerAddress',
          'signature',
          ChainId.LOCALHOST,
          '0xEscrowAddress',
        ),
      ).rejects.toThrow(
        new HttpException(
          'Credential is not in a valid state for on-chain addition.',
          HttpStatus.BAD_REQUEST,
        ),
      );

      expect(credentialRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['validator'],
      });
    });

    it('should throw an error if the signature is invalid', async () => {
      mockCredential.status = CredentialStatus.VALIDATED;
      jest
        .spyOn(credentialRepository, 'findOne')
        .mockResolvedValue(mockCredential);
      const mockKVStoreClient = {
        set: jest.fn().mockResolvedValue(undefined),
      };
      jest.spyOn(userService, 'prepareSignatureBody').mockResolvedValue({
        contents: 'signatureBodyContents',
        from: 'fromAddress',
        to: 'toAddress',
        nonce: 'nonceValue',
      });
      (verifySignature as jest.Mock).mockReturnValue(false);

      KVStoreClient.build = jest.fn().mockResolvedValue(mockKVStoreClient);

      await expect(
        credentialService.addCredentialOnChain(
          1,
          '0xWorkerAddress',
          'signature',
          ChainId.LOCALHOST,
          '0xEscrowAddress',
        ),
      ).rejects.toThrow(new UnauthorizedException('Invalid signature'));

      expect(credentialRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['validator'],
      });
    });
  });
});
