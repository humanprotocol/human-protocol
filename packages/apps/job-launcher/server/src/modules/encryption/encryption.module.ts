import { Module, Global, Provider } from '@nestjs/common';
import { Encryption } from '@human-protocol/sdk';
import { ConfigModule, ConfigService } from '@nestjs/config';

const encryptionProvider: Provider = {
  provide: Encryption,
  useFactory: async (configService: ConfigService) => {
    const privateKey = configService.get<string>('PGP_PRIVATE_KEY')!;
    return await Encryption.build(privateKey);
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
