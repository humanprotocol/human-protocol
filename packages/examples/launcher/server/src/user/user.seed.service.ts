import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { subDays } from "date-fns";

import { UserEntity } from "./user.entity";
import { generateTestUser } from "../common/test";

@Injectable()
export class UserSeedService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userEntityRepository: Repository<UserEntity>,
  ) {}

  public async setup(): Promise<any> {
    const user1 = await this.userEntityRepository.create(generateTestUser()).save();

    const user2 = await this.userEntityRepository.create(generateTestUser()).save();

    user2.createdAt = subDays(new Date(), 7);

    await user2.save();

    return {
      users: [user1, user2],
    };
  }

  public async tearDown(): Promise<void> {
    await this.userEntityRepository.delete({});
  }
}
