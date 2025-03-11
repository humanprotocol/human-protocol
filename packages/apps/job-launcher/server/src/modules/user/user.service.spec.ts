import { createMock } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { PaymentCurrency } from '../../common/enums/payment';
import { UserStatus, UserType } from '../../common/enums/user';
import { PaymentService } from '../payment/payment.service';
import { UserBalanceDto, UserCreateDto } from './user.dto';
import { UserEntity } from './user.entity';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

jest.mock('@human-protocol/sdk');

describe('UserService', () => {
  let userService: UserService;
  let paymentService: PaymentService;
  let userRepository: UserRepository;

  beforeAll(async () => {
    const mockConfigService: Partial<ConfigService> = {};

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
    paymentService = moduleRef.get(PaymentService);
  });

  afterEach(() => {
    jest.resetAllMocks();
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

  describe('getBalance', () => {
    it('should return the correct balance with currency for a user', async () => {
      const userId = 1;
      const expectedBalance: UserBalanceDto = {
        balances: [
          { currency: PaymentCurrency.USD, amount: 100 },
          { currency: PaymentCurrency.HMT, amount: 50 },
          { currency: PaymentCurrency.USDT, amount: 0 },
        ],
        totalUsdAmount: 150,
      };

      jest
        .spyOn(paymentService, 'getUserBalanceByCurrency')
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(50)
        .mockResolvedValue(0);
      jest
        .spyOn(paymentService, 'convertToUSD')
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(50)
        .mockResolvedValue(0);

      const balance = await userService.getBalance(userId);

      expect(balance).toEqual(expectedBalance);
      expect(paymentService.getUserBalanceByCurrency).toHaveBeenCalledTimes(3);
      expect(paymentService.convertToUSD).toHaveBeenCalledTimes(3);
    });
  });

  it('should return zero balance for new users', async () => {
    const userId = 1;
    const expectedBalance: UserBalanceDto = {
      balances: [
        { currency: PaymentCurrency.USD, amount: 0 },
        { currency: PaymentCurrency.HMT, amount: 0 },
        { currency: PaymentCurrency.USDT, amount: 0 },
      ],
      totalUsdAmount: 0,
    };

    jest
      .spyOn(paymentService, 'getUserBalanceByCurrency')
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValue(0);
    jest
      .spyOn(paymentService, 'convertToUSD')
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValue(0);

    const balance = await userService.getBalance(userId);

    expect(balance).toEqual(expectedBalance);
    expect(paymentService.getUserBalanceByCurrency).toHaveBeenCalledTimes(3);
    expect(paymentService.convertToUSD).toHaveBeenCalledTimes(3);
  });
});
