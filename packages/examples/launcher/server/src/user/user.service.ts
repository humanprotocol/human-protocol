import { ConflictException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { createHash } from "crypto";
import { FindConditions, FindManyOptions, FindOneOptions, Not, Repository } from "typeorm";

import { UserEntity } from "./user.entity";
import { IUserCreateDto, IUserUpdateDto } from "./interfaces";
import { IValidatePasswordDto } from "../auth/interfaces";
import * as errors from "../common/constants/errors";
import { AuthEntity } from "../auth/auth.entity";
import { UserStatus, UserType } from "../common/decorators";

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userEntityRepository: Repository<UserEntity>,
    @InjectRepository(AuthEntity)
    private readonly authEntityRepository: Repository<AuthEntity>,
    private readonly configService: ConfigService,
  ) {}

  public async update(where: FindConditions<UserEntity>, dto: Partial<IUserUpdateDto>): Promise<UserEntity> {
    const { email, ...rest } = dto;

    const userEntity = await this.userEntityRepository.findOne(where);

    if (!userEntity) {
      this.logger.log(errors.User.NotFound, UserService.name);
      throw new NotFoundException(errors.User.NotFound);
    }

    if (email && email !== userEntity.email) {
      await this.checkEmail(email, userEntity.id);
      userEntity.status = UserStatus.PENDING;
      userEntity.email = email;
    }

    Object.assign(userEntity, rest);
    return userEntity.save();
  }

  public async updateTokenAddress(
    where: FindConditions<UserEntity>,
    dto: Partial<IUserUpdateDto>,
  ): Promise<UserEntity> {
    const userEntity = await this.userEntityRepository.findOne(where);

    if (!userEntity) {
      this.logger.log(errors.User.NotFound, UserService.name);
      throw new NotFoundException(errors.User.NotFound);
    }

    Object.assign(userEntity, dto);
    return userEntity.save();
  }

  public findOne(
    where: FindConditions<UserEntity>,
    options?: FindOneOptions<UserEntity>,
  ): Promise<UserEntity | undefined> {
    return this.userEntityRepository.findOne({ where, ...options });
  }

  public async getUserById(userId: number): Promise<UserEntity | undefined> {
    return this.findOne({ id: userId });
  }

  public async getUserByEmail(email: string): Promise<UserEntity | undefined> {
    return this.findOne({ email });
  }

  public find(where: FindConditions<UserEntity>, options?: FindManyOptions<UserEntity>): Promise<UserEntity[]> {
    return this.userEntityRepository.find({
      where,
      order: {
        createdAt: "DESC",
      },
      ...options,
    });
  }

  public async create(dto: IUserCreateDto): Promise<UserEntity> {
    const { email, password, ...rest } = dto;

    await this.checkEmail(email, 0);

    return this.userEntityRepository
      .create({
        ...rest,
        email,
        password: this.createPasswordHash(password),
        type: UserType.REQUESTER,
        status: UserStatus.ACTIVE,
      })
      .save();
  }

  public async getByCredentials(email: string, password: string): Promise<UserEntity | undefined> {
    return this.userEntityRepository.findOne({
      where: {
        email,
        password: this.createPasswordHash(password),
      },
    });
  }

  public updatePassword(userEntity: UserEntity, data: IValidatePasswordDto): Promise<UserEntity> {
    userEntity.password = this.createPasswordHash(data.password);
    return userEntity.save();
  }

  public createPasswordHash(password: string): string {
    const passwordSecret = this.configService.get<string>("PASSWORD_SECRET", "");
    return createHash("sha256").update(password).update(passwordSecret).digest("hex");
  }

  public activate(userEntity: UserEntity): Promise<UserEntity> {
    userEntity.status = UserStatus.ACTIVE;
    return userEntity.save();
  }

  public async checkEmail(email: string, id: number): Promise<void> {
    const userEntity = await this.findOne({
      email,
      id: Not(id),
    });

    if (userEntity) {
      this.logger.log(errors.User.DuplicateEmail, UserService.name);
      throw new ConflictException(errors.User.DuplicateEmail);
    }
  }

  public async getUserIdByRefreshToken(refreshToken: string): Promise<number> {
    const authEntity = await this.authEntityRepository.findOne({ refreshToken });

    if (!authEntity) throw new NotFoundException("Token not found");

    return authEntity.userId;
  }
}
