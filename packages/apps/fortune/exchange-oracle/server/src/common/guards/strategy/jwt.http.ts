import { Injectable, Req, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { KVStoreClient, StorageClient } from '@human-protocol/sdk';
import * as jwt from 'jsonwebtoken';
import { Web3Service } from 'src/modules/web3/web3.service';

@Injectable()
export class JwtHttpStrategy extends PassportStrategy(Strategy, 'jwt-http') {
  constructor(private readonly web3Service: Web3Service) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: async (
        request: any,
        rawJwtToken: any,
        done: any,
      ) => {
        try {
          const payload = jwt.decode(rawJwtToken);
          const chainId = this.web3Service.getValidChains()[0];
          const kvstoreClient = await KVStoreClient.build(
            this.web3Service.getSigner(chainId),
          );

          const url = await kvstoreClient.getFileUrlAndVerifyHash(
            (payload as any).reputation_network,
            'jwt_public_key',
          );
          const publicKey = await StorageClient.downloadFileFromUrl(url);

          done(null, publicKey);
        } catch (error) {
          console.error(error);
          done(error);
        }
      },
      passReqToCallback: true,
    });
  }

  public async validate(
    @Req() request: any,
    payload: { email: string; address: string; kyc_status: string },
  ): Promise<any> {
    if (!payload.kyc_status || !payload.email || !payload.address) {
      throw new UnauthorizedException('Invalid token');
    }
    if (payload.kyc_status !== 'approved') {
      throw new UnauthorizedException('Invalid KYC status');
    }
    return true;
  }
}
