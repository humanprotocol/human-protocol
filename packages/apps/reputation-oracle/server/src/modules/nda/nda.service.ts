import { Injectable } from '@nestjs/common';

import { UserNotFoundError, UserRepository } from '@/modules/user';
import { NDAConfigService } from '@/config';
import { NDASignatureDto } from './nda.dto';
import { NDAError, NDAErrorMessage } from './nda.error';

@Injectable()
export class NDAService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly ndaConfigService: NDAConfigService,
  ) {}

  async signNDA(userId: number, nda: NDASignatureDto) {
    const user = await this.userRepository.findOneById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    const latestNdaUrl = this.ndaConfigService.latestNdaUrl;
    if (nda.url !== latestNdaUrl) {
      throw new NDAError(NDAErrorMessage.INVALID_NDA, userId);
    }
    if (user.ndaSignedUrl === latestNdaUrl) {
      return;
    }

    user.ndaSignedUrl = nda.url;

    await this.userRepository.updateOne(user);
  }
}
