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
      status: string;
      wallet_address: string;
      reputation_network: string;
      qualifications?: string[];
      site_key?: string;
      email?: string;
    },
  ): Promise<JwtUserData> {
    if (!payload.user_id) {
      throw new UnauthorizedException('Invalid token: missing user id');
    }

    return {
      user_id: payload.user_id,
      wallet_address: payload.wallet_address,
      status: payload.status,
      reputation_network: payload.reputation_network,
      qualifications: payload.qualifications,
      site_key: payload.site_key,
      email: payload.email,
    };
  }
}
