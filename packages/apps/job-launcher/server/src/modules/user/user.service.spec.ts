import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PaymentService } from '../payment/payment.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { createMock } from '@golevelup/ts-jest';
import { ErrorUser } from '../../common/constants/errors';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';
import { UserCreateDto, UserUpdateDto } from './user.dto';
import { UserEntity } from './user.entity';
import { UserStatus, UserType } from '../../common/enums/user';
import { ethers } from 'ethers';
import { IUserBalance } from '../../common/interfaces';
import { Currency } from '../../common/enums/payment';

const PASSWORD_SECRET = '$2b$10$EICgM2wYixoJisgqckU9gu';

jest.mock('@human-protocol/sdk');

describe('UserService', () => {
  let userService: UserService;
  let paymentService: PaymentService;
  let userRepository: UserRepository;
  let configService: ConfigService;
  let httpService: HttpService;

  beforeAll(async () => {
    const mockConfigService: Partial<ConfigService> = {
      get: jest.fn((key: string, defaultValue?: any) => {
        switch (key) {
          case 'PASSWORD_SECRET':
            return PASSWORD_SECRET;
        }
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: UserRepository, useValue: createMock<UserRepository>() },
        { provide: PaymentService, useValue: createMock<PaymentService>() },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: HttpService, useValue: createMock<HttpService>() },
      ],
    }).compile();

    userService = moduleRef.get<UserService>(UserService);
    userRepository = moduleRef.get(UserRepository);
    configService = moduleRef.get(ConfigService);
    httpService = moduleRef.get(HttpService);
    paymentService = moduleRef.get(PaymentService);
  });

  describe('update', () => {
    it('should update a user and return the updated user entity', async () => {
      const userId = 1;
      const dto: UserUpdateDto = {
        email: 'test@example.com',
        status: UserStatus.ACTIVE,
      };

      const updatedUser: Partial<UserEntity> = {
        id: userId,
        email: dto.email,
        status: dto.status,
      };

      jest
        .spyOn(userRepository, 'updateOne')
        .mockResolvedValue(updatedUser as UserEntity);

      const result = await userService.update(userId, dto);

      expect(userRepository.updateOne).toHaveBeenCalledWith(
        { id: userId },
        dto,
      );
      expect(result).toBe(updatedUser);
    });
  });

  describe('create', () => {
    it('should create a new user and return the created user entity', async () => {
      const dto: UserCreateDto = {
        email: 'test@example.com',
        password: 'password123',
        confirm: 'password123',
      };

      const createdUser: Partial<UserEntity> = {
        id: 1,
        email: dto.email,
        password: 'hashedPassword',
      };

      jest.spyOn(userService, 'checkEmail').mockResolvedValue(undefined);
      jest
        .spyOn(userRepository, 'create')
        .mockResolvedValue(createdUser as UserEntity);
      jest
        .spyOn(userService, 'createPasswordHash')
        .mockReturnValue('hashedPassword');

      const result = await userService.create(dto);

      expect(userService.checkEmail).toHaveBeenCalledWith(dto.email, 0);
      expect(userRepository.create).toHaveBeenCalledWith({
        ...dto,
        email: dto.email,
        password: 'hashedPassword',
        type: UserType.REQUESTER,
        status: UserStatus.PENDING,
      });
      expect(result).toBe(createdUser);
    });

    it('should throw ConflictException if the email is already taken', async () => {
      const dto: UserCreateDto = {
        email: 'test@example.com',
        password: 'password123',
        confirm: 'password123',
      };

      jest
        .spyOn(userService, 'checkEmail')
        .mockRejectedValue(
          new ConflictException(ErrorUser.AccountCannotBeRegistered),
        );

      await expect(userService.create(dto)).rejects.toThrow(
        ErrorUser.AccountCannotBeRegistered,
      );

      expect(userService.checkEmail).toHaveBeenCalledWith(dto.email, 0);
    });
  });

  describe('getByCredentials', () => {
    it('should return the user entity if credentials are valid', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      const userEntity: Partial<UserEntity> = {
        id: 1,
        email,
        password: 'hashedPassword',
      };

      jest
        .spyOn(userRepository, 'findOne')
        .mockResolvedValue(userEntity as UserEntity);
      jest
        .spyOn(userService, 'createPasswordHash')
        .mockReturnValue('hashedPassword');

      const result = await userService.getByCredentials(email, password);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        email,
        password: 'hashedPassword',
      });
      expect(result).toBe(userEntity);
    });

    it('should throw NotFoundException if credentials are invalid', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(userService, 'createPasswordHash')
        .mockReturnValue('hashedPassword');

      await expect(
        userService.getByCredentials(email, password),
      ).rejects.toThrow(NotFoundException);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        email,
        password: 'hashedPassword',
      });
    });
  });
});
