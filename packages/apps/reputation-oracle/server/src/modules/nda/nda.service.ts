import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NDARepository } from './nda.repository';
import { NDASignatureEntity } from './nda-signature.entity';
import { UserEntity } from '../user/user.entity';
import { NDAVersionRepository } from './nda-version.repository';
import { NdaVersionDto } from './nda.dto';
import { NdaError, NdaErrorMessage } from './nda.error';

@Injectable()
export class NDAService {
  constructor(
    @InjectRepository(NDARepository)
    private readonly ndaRepository: NDARepository,
    @InjectRepository(NDAVersionRepository)
    private readonly ndaVersionRepository: NDAVersionRepository,
  ) {}

  public async getLastNDAVersion(
    user: UserEntity,
  ): Promise<NdaVersionDto | null> {
    const lastNDAVersion = await this.ndaVersionRepository.getLastNDAVersion();

    if (!lastNDAVersion) {
      throw new NdaError(NdaErrorMessage.NDA_NOT_FOUND, user.id);
    }

    const existingNDA = await this.ndaRepository.findSignedNDAByUserAndVersion(
      user,
      lastNDAVersion,
    );
    if (existingNDA) {
      return null;
    }

    return {
      version: lastNDAVersion.version,
      documentText: lastNDAVersion.documentText,
    };
  }

  public async signNDA(
    user: UserEntity,
    ipAddress: string,
  ): Promise<boolean | null> {
    const lastNDAVersion = await this.ndaVersionRepository.getLastNDAVersion();

    if (!lastNDAVersion) {
      throw new NdaError(NdaErrorMessage.NDA_NOT_FOUND, user.id);
    }

    const existingNDA = await this.ndaRepository.findSignedNDAByUserAndVersion(
      user,
      lastNDAVersion,
    );
    if (existingNDA) {
      return null;
    }

    const newNda = new NDASignatureEntity();
    newNda.user = user;
    newNda.ipAddress = ipAddress;
    newNda.ndaVersion = lastNDAVersion;

    await this.ndaRepository.createUnique(newNda);

    return true;
  }

  public async isLatestSigned(user: UserEntity): Promise<boolean> {
    const lastNDAVersion = await this.ndaVersionRepository.getLastNDAVersion();

    if (!lastNDAVersion) {
      return false;
    }

    const ndaEntity = await this.ndaRepository.findSignedNDAByUserAndVersion(
      user,
      lastNDAVersion,
    );
    if (!ndaEntity) {
      return false;
    }

    return true;
  }
}
