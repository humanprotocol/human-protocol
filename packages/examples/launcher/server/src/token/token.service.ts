import { FindConditions, Repository } from "typeorm";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { TokenEntity, TokenType } from "./token.entity";
import { UserEntity } from "../user/user.entity";

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(TokenEntity)
    private readonly tokenEntityRepository: Repository<TokenEntity>,
  ) {}

  public findOne(where: FindConditions<TokenEntity>): Promise<TokenEntity | undefined> {
    return this.tokenEntityRepository.findOne({ where, relations: ["user"] });
  }

  public async getToken(tokenType: TokenType, userEntity: UserEntity): Promise<TokenEntity> {
    const token = await this.tokenEntityRepository.findOne({
      tokenType,
      user: userEntity,
    });

    if (token) return token.save();

    return this.tokenEntityRepository
      .create({
        tokenType,
        user: userEntity,
      })
      .save();
  }
}
