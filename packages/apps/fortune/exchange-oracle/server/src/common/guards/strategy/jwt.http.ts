import { Injectable, Req } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { KVStore__factory } from '@human-protocol/core/typechain-types';
import { ChainId, NETWORKS, StorageClient } from '@human-protocol/sdk';
import { ethers } from 'ethers';
import * as jwt from 'jsonwebtoken';
import { JWT_KVSTORE_KEY, KYC_APPROVED } from '../../../common/constant';
import { Role } from '../../../common/enums/role';
import { JwtUser } from '../../../common/types/jwt';
import { Web3Service } from '../../../modules/web3/web3.service';
import { AuthError, ValidationError } from '../../errors';

@Injectable()
export class JwtHttpStrategy extends PassportStrategy(Strategy, 'jwt-http') {
  // In-memory cache for public keys with expiration
  private publicKeyCache: Map<string, { value: string; expires: number }> =
    new Map();
  private cacheTTL = 24 * 60 * 60 * 1000; // 1 day

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
          const address = (payload as any).reputation_network;
          const cacheKey = `${chainId}-${address}`;

          const cached = this.publicKeyCache.get(cacheKey);

          let publicKey: string | undefined;
          if (cached && cached.expires > Date.now()) {
            publicKey = cached.value;
          } else {
            const signer = this.web3Service.getSigner(chainId);
            const url = await this.getFileUrlAndVerifyHash(
              signer,
              chainId,
              address,
              JWT_KVSTORE_KEY,
            );
            publicKey = (await StorageClient.downloadFileFromUrl(
              url,
            )) as string;

            this.publicKeyCache.set(cacheKey, {
              value: publicKey,
              expires: Date.now() + this.cacheTTL,
            });
          }

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
      throw new AuthError('Invalid token: missing email');
    }

    if (!payload.role) {
      throw new AuthError('Invalid token: missing role');
    }

    if (!Object.values(Role).includes(payload.role as Role)) {
      throw new AuthError(`Invalid token: unrecognized role "${payload.role}"`);
    }

    const role: Role = payload.role as Role;

    if (role !== Role.HumanApp) {
      if (!payload.kyc_status) {
        throw new AuthError('Invalid token: missing KYC status');
      }

      if (!payload.wallet_address) {
        throw new AuthError('Invalid token: missing address');
      }

      if (payload.kyc_status !== KYC_APPROVED) {
        throw new AuthError(
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

  private async getFileUrlAndVerifyHash(
    signer: ethers.Wallet,
    chainId: ChainId,
    address: string,
    urlKey = 'url',
  ): Promise<string> {
    if (!ethers.isAddress(address)) {
      throw new ValidationError('Invalid address');
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
      throw new Error(`Failed to get URL: ${e.message}`);
    }

    if (!url?.length) {
      return '';
    }

    try {
      hash = await contract.get(address, hashKey);
    } catch (e) {
      throw new Error(`Failed to get Hash: ${e.message}`);
    }

    const content = await fetch(url).then((res) => res.text());
    const contentHash = ethers.keccak256(ethers.toUtf8Bytes(content));

    const formattedHash = hash?.replace(/^0x/, '');
    const formattedContentHash = contentHash?.replace(/^0x/, '');

    if (formattedHash !== formattedContentHash) {
      throw new ValidationError('Invalid hash');
    }

    return url;
  }
}
