import { Module, Global, Provider } from '@nestjs/common';
import { Encryption } from '@human-protocol/sdk';
import { ConfigModule } from '@nestjs/config';
import { PGPConfigService } from '../../common/config/pgp-config.service';
import { ErrorEncryption } from '../../common/constants/errors';

const encryptionProvider: Provider = {
  provide: Encryption,
  useFactory: async (pgpConfigService: PGPConfigService) => {
    if (!pgpConfigService.encrypt && !pgpConfigService.privateKey) {
      return null;
    }
    const privateKey = pgpConfigService.privateKey;
    const passPhrase = pgpConfigService.passphrase;

    if (privateKey) return await Encryption.build(privateKey, passPhrase);

    throw new Error(ErrorEncryption.MissingPrivateKey);
  },
  inject: [PGPConfigService],
};

@Global()
@Module({
  imports: [ConfigModule],
  providers: [encryptionProvider],
  exports: [encryptionProvider],
})
export class EncryptionModule {}
