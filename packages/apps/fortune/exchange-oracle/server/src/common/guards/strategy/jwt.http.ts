import {
  BadRequestException,
  Injectable,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { KVStore__factory } from '@human-protocol/core/typechain-types';
import {
  ChainId,
  KVStoreUtils,
  NETWORKS,
  StorageClient,
} from '@human-protocol/sdk';
import { ethers } from 'ethers';
import * as jwt from 'jsonwebtoken';
import { JWT_KVSTORE_KEY, KYC_APPROVED } from '../../../common/constant';
import { Role } from '../../../common/enums/role';
import { JwtUser } from '../../../common/types/jwt';
import { Web3Service } from '../../../modules/web3/web3.service';

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
        const getFileUrlAndVerifyHash = async (
          signer: ethers.Wallet,
          chainId: ChainId,
          address: string,
          urlKey = 'url',
        ): Promise<string> => {
          if (!ethers.isAddress(address)) {
            throw new BadRequestException('Invalid address');
          }

          const hashKey = urlKey + '_hash';
          let url = '',
            hash = '';

          const contract = KVStore__factory.connect(
            NETWORKS[chainId]!.kvstoreAddress,
            signer,
          );

          try {
            url = await contract.get(address, urlKey);
          } catch (e) {
            if (e instanceof Error) {
              throw new Error(`Failed to get URL: ${e.message}`);
            }
          }

          // Return empty string if no URL found
          if (!url?.length) {
            return '';
          }

          try {
            hash = await contract.get(address, hashKey);
          } catch (e) {
            if (e instanceof Error) {
              throw new Error(`Failed to get Hash: ${e.message}`);
            }
          }

          const content = await fetch(url).then((res) => res.text());
          const contentHash = ethers.keccak256(ethers.toUtf8Bytes(content));

          const formattedHash = hash?.replace(/^0x/, '');
          const formattedContentHash = contentHash?.replace(/^0x/, '');

          if (formattedHash !== formattedContentHash) {
            throw new BadRequestException('Invalid hash');
          }

          return url;
        };

        try {
          const payload = jwt.decode(rawJwtToken);
          const chainId = this.web3Service.getValidChains()[0];
          const signer = this.web3Service.getSigner(chainId);

          const url = await getFileUrlAndVerifyHash(
            signer,
            chainId,
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
      role: string;
      email: string;
      wallet_address: string;
      kyc_status: string;
      reputation_network: string;
      qualifications?: string[];
    },
  ): Promise<JwtUser> {
    if (!payload.email) {
      throw new UnauthorizedException('Invalid token: missing email');
    }

    if (!payload.role) {
      throw new UnauthorizedException('Invalid token: missing role');
    }

    if (!Object.values(Role).includes(payload.role as Role)) {
      throw new UnauthorizedException(
        `Invalid token: unrecognized role "${payload.role}"`,
      );
    }

    const role: Role = payload.role as Role;

    if (role !== Role.HumanApp) {
      if (!payload.kyc_status) {
        throw new UnauthorizedException('Invalid token: missing KYC status');
      }

      if (!payload.wallet_address) {
        throw new UnauthorizedException('Invalid token: missing address');
      }

      if (payload.kyc_status !== KYC_APPROVED) {
        throw new UnauthorizedException(
          `Invalid token: expected KYC status "${KYC_APPROVED}", but received "${payload.kyc_status}"`,
        );
      }
    }

    return {
      role: role,
      address: payload.wallet_address,
      email: payload.email,
      kycStatus: payload.kyc_status,
      reputationNetwork: payload.reputation_network,
      qualifications: payload.qualifications,
    };
  }
}
