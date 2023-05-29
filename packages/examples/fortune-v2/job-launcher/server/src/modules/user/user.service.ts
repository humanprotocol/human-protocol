import { ConflictException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import bcrypt from "bcrypt";
import { Not } from "typeorm";

import { UserEntity } from "./user.entity";
import { UserStatus, UserType } from "../../common/enums/user";
import { UserCreateDto, UserUpdateDto } from "./user.dto";
import { UserRepository } from "./user.repository";
import { ValidatePasswordDto } from "../auth/auth.dto";
import { ErrorUser } from "../../common/constants/errors";

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) {}

  public async update(userId: number, dto: UserUpdateDto): Promise<UserEntity> {
    return this.userRepository.updateOne({ id: userId }, dto)
  }

  public async create(dto: UserCreateDto): Promise<UserEntity> {
    const { email, password, ...rest } = dto;

    await this.checkEmail(email, 0);

    return this.userRepository
      .create({
        ...rest,
        email,
        password: this.createPasswordHash(password),
        type: UserType.REQUESTER,
        status: UserStatus.ACTIVE
      });
  }

  public async getByCredentials(email: string, password: string): Promise<UserEntity> {
    const userEntity = await this.userRepository.findOne({
        email,
        password: this.createPasswordHash(password),
      },
    );

    if (!userEntity) {
      throw new NotFoundException("Invalid email or password");
    }

    return userEntity;
  }

  public async getByEmail(email: string): Promise<UserEntity | undefined> {
    return this.userRepository.findOne({ email });
  }

  public updatePassword(userEntity: UserEntity, data: ValidatePasswordDto): Promise<UserEntity> {
    userEntity.password = this.createPasswordHash(data.password);
    return userEntity.save();
  }

  public createPasswordHash(password: string): string {
    const passwordSecret = this.configService.get<string>("PASSWORD_SECRET", "");
    return bcrypt.hashSync(password, passwordSecret);
  }

  public activate(userEntity: UserEntity): Promise<UserEntity> {
    userEntity.status = UserStatus.ACTIVE;
    return userEntity.save();
  }

  public async checkEmail(email: string, id: number): Promise<void> {
    const userEntity = await this.userRepository.findOne({
      email,
      id: Not(id),
    });

    if (userEntity) {
      this.logger.log(ErrorUser.DuplicateEmail, UserService.name);
      throw new ConflictException(ErrorUser.DuplicateEmail);
    }
  }
}
