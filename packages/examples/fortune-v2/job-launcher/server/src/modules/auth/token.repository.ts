import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindConditions, Repository } from "typeorm";
import { TokenEntity } from "./token.entity";
import { TokenCreateDto } from "./auth.dto";

@Injectable()
export class TokenRepository {
  constructor(
    @InjectRepository(TokenEntity)
    private readonly tokenEntityRepository: Repository<TokenEntity>,
  ) {}

  public findOne(where: FindConditions<TokenEntity>): Promise<TokenEntity | undefined> {
    return this.tokenEntityRepository.findOne({ where, relations: ["user"] });
  }

  public async create(dto: TokenCreateDto): Promise<TokenEntity> {
    return this.tokenEntityRepository
      .create(dto)
      .save();
  }
}
