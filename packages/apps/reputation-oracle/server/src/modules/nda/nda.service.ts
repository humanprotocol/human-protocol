import { Injectable } from '@nestjs/common';

import { UserEntity, UserRepository } from '../user';
import { NDAConfigService } from '../../config';
import { NDASignatureDto } from './nda.dto';
import { NDAError, NDAErrorMessage } from './nda.error';

@Injectable()
export class NDAService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly ndaConfigService: NDAConfigService,
  ) {}

  async signNDA(user: UserEntity, nda: NDASignatureDto) {
    const latestNdaUrl = this.ndaConfigService.latestNdaUrl;
    if (nda.url !== latestNdaUrl) {
      throw new NDAError(NDAErrorMessage.INVALID_NDA, user.id);
    }
    if (user.ndaSignedUrl === latestNdaUrl) {
      return;
    }

    user.ndaSignedUrl = nda.url;

    await this.userRepository.updateOne(user);
  }
}
