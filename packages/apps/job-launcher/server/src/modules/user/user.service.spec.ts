jest.mock('@human-protocol/sdk');

import { createMock } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { UserStatus, UserType } from '../../common/enums/user';
import { UserCreateDto } from './user.dto';
import { UserEntity } from './user.entity';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

describe('UserService', () => {
  let userService: UserService;
  let userRepository: UserRepository;

  beforeAll(async () => {
    const mockConfigService: Partial<ConfigService> = {};

    const moduleRef = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: UserRepository, useValue: createMock<UserRepository>() },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: HttpService, useValue: createMock<HttpService>() },
      ],
    }).compile();

    userService = moduleRef.get<UserService>(UserService);
    userRepository = moduleRef.get(UserRepository);
  });

  describe('create', () => {
    it('should create a new user and return the created user entity', async () => {
      const dto: UserCreateDto = {
        email: 'test@example.com',
        password: 'password123',
        hCaptchaToken: 'test',
      };
      const createdUser: Partial<UserEntity> = {
        email: dto.email,
        password: expect.any(String),
        type: UserType.REQUESTER,
        status: UserStatus.PENDING,
      };

      const result = await userService.create(dto);
      expect(userRepository.createUnique).toHaveBeenCalledWith({
        email: dto.email,
        password: expect.any(String),
        type: UserType.REQUESTER,
        status: UserStatus.PENDING,
      });
      expect(result).toMatchObject(createdUser);
    });
  });

  describe('getByCredentials', () => {
    const email = 'test@example.com';
    const password = 'password123';
    const hashedPassword =
      '$2b$12$Z02o9/Ay7CT0n99icApZYORH8iJI9VGtl3mju7d0c4SdDDujhSzOa';

    const userEntity: Partial<UserEntity> = {
      id: 1,
      email,
      password: hashedPassword,
    };

    it('should return the user entity if credentials are valid', async () => {
      jest
        .spyOn(userRepository, 'findByEmail')
        .mockResolvedValue(userEntity as UserEntity);

      const result = await userService.getByCredentials(email, password);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(result).toBe(userEntity);
    });

    it('should return null if credentials are invalid', async () => {
      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);
      const result = await userService.getByCredentials(email, password);
      expect(result).toBe(null);
      expect(userRepository.findByEmail).toHaveBeenCalledWith(email);
    });
  });
});
