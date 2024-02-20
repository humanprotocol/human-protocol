import { Module, Global, Provider } from '@nestjs/common';
import { Encryption } from '@human-protocol/sdk';
import { ConfigModule, ConfigService } from '@nestjs/config';

const encryptionProvider: Provider = {
  provide: Encryption,
  useFactory: async (configService: ConfigService) => {
    if (!configService.get<string>('PGP_ENCRYPT')) {
      return null;
    }
    const privateKey = configService.get<string>('PGP_PRIVATE_KEY')!;
    const passPhrase = configService.get<string>('PGP_PASSPHRASE');
    return await Encryption.build(privateKey, passPhrase);
  },
  inject: [ConfigService],
};

@Global()
@Module({
  imports: [ConfigModule],
  providers: [encryptionProvider],
  exports: [encryptionProvider],
})
export class EncryptionModule {}
