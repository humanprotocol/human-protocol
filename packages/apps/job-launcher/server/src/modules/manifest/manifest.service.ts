import { ChainId, Encryption, KVStoreUtils } from '@human-protocol/sdk';
import {
  ValidationError as ClassValidationError,
  Injectable,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { PGPConfigService } from '../../common/config/pgp-config.service';
import { ErrorJob } from '../../common/constants/errors';
import {
  FortuneJobType,
  HCaptchaJobType,
  JobRequestType,
} from '../../common/enums/job';
import { ValidationError } from '../../common/errors';
import { StorageService } from '../storage/storage.service';
import { Web3Service } from '../web3/web3.service';
import {
  CvatManifestDto,
  FortuneManifestDto,
  HCaptchaManifestDto,
  ManifestDto,
} from './manifest.dto';

@Injectable()
export class ManifestService {
  public readonly bucket: string;

  constructor(
    private readonly web3Service: Web3Service,
    private readonly pgpConfigService: PGPConfigService,
    private readonly storageService: StorageService,
    private readonly encryption: Encryption,
  ) {}

  async uploadManifest(
    chainId: ChainId,
    data: any,
    oracleAddresses: string[],
  ): Promise<any> {
    let manifestFile = data;

    if (this.pgpConfigService.encrypt) {
      const signer = this.web3Service.getSigner(chainId);
      const publicKeys: string[] = [
        await KVStoreUtils.getPublicKey(chainId, await signer.getAddress()),
      ];

      for (const address of oracleAddresses) {
        const publicKey = await KVStoreUtils.getPublicKey(chainId, address);
        if (publicKey) publicKeys.push(publicKey);
      }
      manifestFile = await this.encryption.signAndEncrypt(
        JSON.stringify(data),
        publicKeys,
      );
    }

    return this.storageService.uploadJsonLikeData(manifestFile);
  }

  public async validateManifest(
    requestType: JobRequestType,
    manifest: ManifestDto,
  ): Promise<void> {
    let dtoCheck;

    if (requestType === FortuneJobType.FORTUNE) {
      dtoCheck = plainToInstance(FortuneManifestDto, manifest);
    } else if (requestType === HCaptchaJobType.HCAPTCHA) {
      dtoCheck = plainToInstance(HCaptchaManifestDto, manifest);
    } else {
      dtoCheck = plainToInstance(CvatManifestDto, manifest);
    }

    const validationErrors: ClassValidationError[] = await validate(dtoCheck);

    if (validationErrors.length > 0) {
      throw new ValidationError(ErrorJob.ManifestValidationFailed);
    }
  }

  async downloadManifest(
    manifestUrl: string,
    requestType: JobRequestType,
  ): Promise<ManifestDto> {
    const manifest = (await this.storageService.downloadJsonLikeData(
      manifestUrl,
    )) as ManifestDto;

    await this.validateManifest(requestType, manifest);

    return manifest;
  }
}
