import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { UserSeedService } from "./user.seed.service";
import { UserEntity } from "./user.entity";
import { UserReposotory } from "./user.repository";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [UserSeedService, UserReposotory],
  exports: [UserSeedService],
})
export class UserSeedModule {}
