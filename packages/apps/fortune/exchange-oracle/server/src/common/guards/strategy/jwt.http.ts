import { Injectable, Req, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { KVStoreClient, StorageClient } from '@human-protocol/sdk';
import * as jwt from 'jsonwebtoken';
import { Web3Service } from '../../../modules/web3/web3.service';
import { JwtUser } from '../../../common/types/jwt';
import { JWT_KVSTORE_KEY, KYC_APPROVED } from '../../../common/constant';

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
            JWT_KVSTORE_KEY,
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
    payload: {
      email: string;
      address: string;
      kyc_status: string;
      reputation_network: string;
    },
  ): Promise<JwtUser> {
    if (!payload.kyc_status || !payload.email || !payload.address) {
      throw new UnauthorizedException('Invalid token');
    }
    if (payload.kyc_status !== KYC_APPROVED) {
      throw new UnauthorizedException('Invalid KYC status');
    }
    return {
      address: payload.address,
      email: payload.email,
      kycStatus: payload.kyc_status,
      reputationNetwork: payload.reputation_network,
    };
  }
}
