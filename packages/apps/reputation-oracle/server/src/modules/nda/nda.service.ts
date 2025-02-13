import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NDARepository } from './nda.repository';
import { UserEntity } from '../user/user.entity';
import { NDAVersionRepository } from './nda-version.repository';
import { NdaVersionDto } from './nda.dto';
import { NdaNotFoundError, NdaSignedError } from './nda.error';
import { NdaSignatureStatus } from '../../common/enums';

@Injectable()
export class NDAService {
  constructor(
    @InjectRepository(NDARepository)
    private readonly ndaRepository: NDARepository,
    @InjectRepository(NDAVersionRepository)
    private readonly ndaVersionRepository: NDAVersionRepository,
  ) {}

  public async getLastNDAVersion(): Promise<NdaVersionDto | null> {
    const lastNDAVersion = await this.ndaVersionRepository.getLastNDAVersion();

    if (!lastNDAVersion) {
      throw new NdaNotFoundError(undefined);
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
      throw new NdaNotFoundError(`user id: ${user.id}`);
    }

    const existingNDA = await this.ndaRepository.findSignedNDAByUserAndVersion(
      user.id,
      lastNDAVersion.id,
    );
    if (existingNDA) {
      throw new NdaSignedError(user.id, lastNDAVersion.version);
    }

    const newNda = this.ndaRepository.create({
      user,
      ipAddress,
      ndaVersion: lastNDAVersion,
      status: NdaSignatureStatus.SIGNED,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.ndaRepository.createUnique(newNda);

    return true;
  }

  public async isLatestSigned(userId: number): Promise<boolean> {
    const lastNDAVersion = await this.ndaVersionRepository.getLastNDAVersion();

    if (!lastNDAVersion) {
      return false;
    }

    const ndaEntity = await this.ndaRepository.findSignedNDAByUserAndVersion(
      userId,
      lastNDAVersion.id,
    );
    if (!ndaEntity) {
      return false;
    }

    return true;
  }
}
