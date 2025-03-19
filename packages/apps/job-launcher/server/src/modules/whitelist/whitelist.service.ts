import { Injectable } from '@nestjs/common';
import { WhitelistRepository } from './whitelist.repository';

@Injectable()
export class WhitelistService {
  constructor(private readonly whitelistRepository: WhitelistRepository) {}

  async isUserWhitelisted(userId: number): Promise<boolean> {
    const user = await this.whitelistRepository.findOneByUserId(userId);
    return !!user;
  }
}
