import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhitelistService } from './whitelist.service';
import { WhitelistEntity } from './whitelist.entity';
import { WhitelistRepository } from './whitelist.repository';

@Module({
  imports: [TypeOrmModule.forFeature([WhitelistEntity])],
  providers: [WhitelistService, WhitelistRepository],
  exports: [WhitelistService, WhitelistRepository],
})
export class WhitelistModule {}
