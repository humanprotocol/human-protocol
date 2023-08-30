
import { BadRequestException, CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { verifySignature } from '../utils/signature';
import { HEADER_SIGNATURE_KEY } from '../constants';
import { ConfigService } from '@nestjs/config';
import { ConfigNames } from '../config';
import { OracleType } from '../enums/webhook';

@Injectable()
export class SignatureAuthGuard implements CanActivate {
  constructor(
    public readonly configService: ConfigService
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    const data = request.body;
    const signature = request.headers[HEADER_SIGNATURE_KEY]; 

    try {
      const address = this.determineAddress(request);
      const isVerified = verifySignature(data, signature, address)

      if (isVerified) {
        return true;
      }
    } catch (error) {
      console.error(error);
    }

    throw new UnauthorizedException('Unauthorized');
  }

  public determineAddress(request: any): string {
    const originalUrl = request.originalUrl;
    const parts = originalUrl.split('/');
    const oracleType = parts[2];

    if (oracleType === OracleType.FORTUNE) {
      return this.configService.get<string>(
        ConfigNames.FORTUNE_EXCHANGE_ORACLE_ADDRESS,
      )!
    } else if (oracleType === OracleType.CVAT) {
      return this.configService.get<string>(
        ConfigNames.CVAT_EXCHANGE_ORACLE_ADDRESS,
      )!
    } else {
      throw new BadRequestException('Unable to determine address from origin URL');
    }
  }
}