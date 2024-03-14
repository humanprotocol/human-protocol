import { Module, Global, Provider } from '@nestjs/common';
import { Encryption } from '@human-protocol/sdk';
import { ConfigModule } from '@nestjs/config';
import { PGPConfigService } from 'src/common/config';

const encryptionProvider: Provider = {
  provide: Encryption,
  useFactory: async (pgpConfigService: PGPConfigService) => {
    if (!pgpConfigService.encrypt) {
      return null;
    }
    const privateKey = pgpConfigService.privateKey;
    const passPhrase = pgpConfigService.passphrase;
    return await Encryption.build(privateKey, passPhrase);
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
