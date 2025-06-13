import { Injectable, Req, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import * as jwt from 'jsonwebtoken';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { EnvironmentConfigService } from '../../../common/config/environment-config.service';
import { JwtUserData } from '../../../common/utils/jwt-token.model';
import { KvStoreGateway } from '../../../integrations/kv-store/kv-store.gateway';

@Injectable()
export class JwtHttpStrategy extends PassportStrategy(Strategy, 'jwt-http') {
  constructor(
    private readonly configService: EnvironmentConfigService,
    private readonly kvStoreGateway: KvStoreGateway,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: async (
        _request: any,
        rawJwtToken: any,
        done: any,
      ) => {
        try {
          const payload = jwt.decode(rawJwtToken);
          const chainId = this.configService.chainIdsEnabled[0];
          const address = (payload as any).reputation_network;
          const pubKey = await this.kvStoreGateway.getReputationOraclePublicKey(
            chainId,
            address,
          );
          done(null, pubKey);
        } catch (error) {
          console.error(error);
          done(error);
        }
      },
      passReqToCallback: true,
    });
  }

  public async validate(
    @Req() _request: any,
    payload: {
      user_id: string;
      email: string;
      wallet_address: string;
      kyc_status: string;
      reputation_network: string;
      qualifications?: string[];
      site_key: string;
      iat: number;
      exp: number;
    },
  ): Promise<JwtUserData> {
    console.log('JWT payload in validate:', payload);

    if (!payload.email) {
      throw new UnauthorizedException('Invalid token: missing email');
    }

    return {
      user_id: payload.user_id,
      wallet_address: payload.wallet_address,
      email: payload.email,
      kyc_status: payload.kyc_status === 'approved' ? 'approved' : 'none',
      reputation_network: payload.reputation_network,
      qualifications: payload.qualifications,
      site_key: payload.site_key,
      iat: payload.iat,
      exp: payload.exp,
    };
  }
}
