import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { createMock } from '@golevelup/ts-jest';
import { ErrorUser } from '../../common/constants/errors';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';
import { UserCreateDto, UserUpdateDto } from './user.dto';
import { UserEntity } from './user.entity';
import { UserStatus, UserType } from '../../common/enums/user';
import { getNonce } from '../../common/utils/signature';
import { MOCK_ADDRESS } from '../../../test/constants';

jest.mock('@human-protocol/sdk');

describe('UserService', () => {
  let userService: UserService;
  let userRepository: UserRepository;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: UserRepository, useValue: createMock<UserRepository>() },
      ],
    }).compile();

    userService = moduleRef.get<UserService>(UserService);
    userRepository = moduleRef.get(UserRepository);
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
        type: UserType.WORKER,
      };
      const hashedPassword =
        '$2b$12$Z02o9/Ay7CT0n99icApZYORH8iJI9VGtl3mju7d0c4SdDDujhSzOa';
      const createdUser: Partial<UserEntity> = {
        id: 1,
        email: dto.email,
        password: hashedPassword,
      };

      jest.spyOn(userService, 'checkEmail').mockResolvedValue(undefined);
      jest
        .spyOn(userRepository, 'create')
        .mockResolvedValue(createdUser as UserEntity);

      const result = await userService.create(dto);

      expect(userService.checkEmail).toHaveBeenCalledWith(dto.email, 0);
      expect(userRepository.create).toHaveBeenCalledWith({
        ...dto,
        email: dto.email,
        password: expect.any(String),
        type: UserType.WORKER,
        status: UserStatus.PENDING,
      });
      expect(result).toBe(createdUser);
    });

    it('should throw ConflictException if the email is already taken', async () => {
      const dto: UserCreateDto = {
        email: 'test@example.com',
        password: 'password123',
        confirm: 'password123',
        type: UserType.WORKER,
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
        .spyOn(userRepository, 'findOne')
        .mockResolvedValue(userEntity as UserEntity);

      const result = await userService.getByCredentials(email, password);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        email,
      });
      expect(result).toBe(userEntity);
    });

    it('should throw NotFoundException if credentials are invalid', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(
        userService.getByCredentials(email, password),
      ).rejects.toThrow(NotFoundException);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        email,
      });
    });
  });

  describe('createWeb3User', () => {
    const address = '0x0755D4d722a4a201c1C5A4B5E614D913e7747b36';
    const type = UserType.WORKER;
    const nonce = getNonce();

    it('should create a new user and return the created user entity', async () => {
      const createdUser: Partial<UserEntity> = {
        id: 1,
        evmAddress: address,
        nonce,
      };

      jest
        .spyOn(userRepository, 'createWeb3User')
        .mockResolvedValue(createdUser as UserEntity);

      const result = await userService.createWeb3User(address, type);

      expect(userRepository.createWeb3User).toHaveBeenCalledWith(
        expect.objectContaining({
          evmAddress: address,
          type,
          status: UserStatus.ACTIVE,
        }),
      );
      expect(result).toBe(createdUser);
    });

    it('should throw ConflictException if the address is already taken', async () => {
      jest
        .spyOn(userRepository, 'findOne')
        .mockResolvedValue({ evmAddress: MOCK_ADDRESS } as UserEntity);

      await expect(userService.createWeb3User(address, type)).rejects.toThrow(
        ConflictException,
      );

      expect(userRepository.findOne).toHaveBeenCalledWith({
        evmAddress: address,
      });
    });
  });

  describe('getByAddress', () => {
    const address = '0x0755D4d722a4a201c1C5A4B5E614D913e7747b36';

    it('should return the user entity if the address exists', async () => {
      const userEntity: Partial<UserEntity> = {
        id: 1,
        evmAddress: address,
      };

      jest
        .spyOn(userRepository, 'findOne')
        .mockResolvedValue(userEntity as UserEntity);

      const result = await userService.getByAddress(address);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        evmAddress: address,
      });
      expect(result).toBe(userEntity);
    });

    it('should throw NotFoundException if the address does not exist', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(userService.getByAddress(address)).rejects.toThrow(
        NotFoundException,
      );

      expect(userRepository.findOne).toHaveBeenCalledWith({
        evmAddress: address,
      });
    });
  });
});
