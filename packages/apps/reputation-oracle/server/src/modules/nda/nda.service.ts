import { Injectable } from '@nestjs/common';
import { AuthConfigService } from '../../config/auth-config.service';
import { UserEntity, UserRepository } from '../user';
import { NDASignatureDto } from './nda.dto';
import { NDAError, NDAErrorMessage } from './nda.error';

@Injectable()
export class NDAService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly authConfigService: AuthConfigService,
  ) {}

  async signNDA(user: UserEntity, nda: NDASignatureDto) {
    const ndaUrl = this.authConfigService.latestNdaUrl;
    if (nda.url !== ndaUrl) {
      throw new NDAError(NDAErrorMessage.INVALID_NDA, user.id);
    }
    if (user.ndaSignedUrl === ndaUrl) {
      return;
    }

    user.ndaSignedUrl = nda.url;

    await this.userRepository.updateOne(user);
  }
}
