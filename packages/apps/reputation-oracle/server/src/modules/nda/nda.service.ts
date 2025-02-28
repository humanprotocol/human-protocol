import { Injectable } from '@nestjs/common';
import { AuthConfigService } from '../../config/auth-config.service';
import { UserEntity } from '../user/user.entity';
import { UserRepository } from '../user/user.repository';
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
    if (user.ndaSigned === ndaUrl) {
      throw new NDAError(NDAErrorMessage.NDA_EXISTS, user.id);
    }

    user.ndaSigned = nda.url;

    await this.userRepository.updateOne(user);
  }
}
