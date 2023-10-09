import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verifySignature } from '../utils/signature';
import { HEADER_SIGNATURE_KEY } from '../constants';
import { ConfigService } from '@nestjs/config';
import { ConfigNames } from '../config';

@Injectable()
export class SignatureAuthGuard implements CanActivate {
  constructor(public readonly configService: ConfigService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const data = request.body;
    const signature = request.headers[HEADER_SIGNATURE_KEY];
    const oracleAdresses = [
      this.configService.get<string>(
        ConfigNames.FORTUNE_EXCHANGE_ORACLE_ADDRESS,
      )!,
      this.configService.get<string>(ConfigNames.CVAT_EXCHANGE_ORACLE_ADDRESS)!,
    ];

    try {
      const isVerified = verifySignature(data, signature, oracleAdresses);

      if (isVerified) {
        return true;
      }
    } catch (error) {
      console.error(error);
    }

    throw new UnauthorizedException('Unauthorized');
  }
}
