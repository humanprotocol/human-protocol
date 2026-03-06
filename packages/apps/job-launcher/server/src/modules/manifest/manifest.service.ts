import { ChainId, Encryption, KVStoreUtils } from '@human-protocol/sdk';
import {
  ValidationError as ClassValidationError,
  Injectable,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { ethers } from 'ethers';
import { CvatConfigService } from '../../common/config/cvat-config.service';
import { PGPConfigService } from '../../common/config/pgp-config.service';
import { ErrorJob } from '../../common/constants/errors';
import {
  CvatJobType,
  FortuneJobType,
  HCaptchaJobType,
  JobRequestType,
} from '../../common/enums/job';
import { ConflictError, ValidationError } from '../../common/errors';
import {
  generateBucketUrl,
  listObjectsInBucket,
} from '../../common/utils/storage';
import { CreateJob, JobCvatDto } from '../job/job.dto';
import {
  CvatAnnotationData,
  CvatCalculateJobBounty,
  CvatImageData,
  GenerateUrls,
} from '../job/job.interface';
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
    private readonly cvatConfigService: CvatConfigService,
    private readonly pgpConfigService: PGPConfigService,
    private readonly storageService: StorageService,
    private readonly encryption: Encryption,
  ) {}

  async createManifest(
    dto: CreateJob,
    requestType: JobRequestType,
    fundAmount: number,
    decimals: number,
  ): Promise<any> {
    switch (requestType) {
      case FortuneJobType.FORTUNE:
        return {
          ...dto,
          requestType,
          fundAmount,
        };

      case CvatJobType.IMAGE_POLYGONS:
      case CvatJobType.IMAGE_BOXES:
      case CvatJobType.IMAGE_POINTS:
      case CvatJobType.IMAGE_BOXES_FROM_POINTS:
      case CvatJobType.IMAGE_SKELETONS_FROM_BOXES:
        return this.createCvatManifest(
          dto as JobCvatDto,
          requestType,
          fundAmount,
          decimals,
        );

      default:
        throw new ValidationError(ErrorJob.InvalidRequestType);
    }
  }

  private async getCvatElementsCount(
    urls: GenerateUrls,
    requestType: CvatJobType,
  ): Promise<number> {
    let gt: any, gtEntries: number;
    switch (requestType) {
      case CvatJobType.IMAGE_POLYGONS:
      case CvatJobType.IMAGE_BOXES:
      case CvatJobType.IMAGE_POINTS: {
        const data = await listObjectsInBucket(urls.dataUrl);
        if (!data || data.length === 0 || !data[0])
          throw new ValidationError(ErrorJob.DatasetValidationFailed);
        gt = (await this.storageService.downloadJsonLikeData(
          `${urls.gtUrl.protocol}//${urls.gtUrl.host}${urls.gtUrl.pathname}`,
        )) as any;
        if (!gt || !gt.images || gt.images.length === 0)
          throw new ValidationError(ErrorJob.GroundThuthValidationFailed);

        await this.checkImageConsistency(gt.images, data);

        return data.length - gt.images.length;
      }

      case CvatJobType.IMAGE_BOXES_FROM_POINTS: {
        const points = (await this.storageService.downloadJsonLikeData(
          urls.pointsUrl!.href,
        )) as any;
        gt = (await this.storageService.downloadJsonLikeData(
          urls.gtUrl.href,
        )) as any;

        if (!gt || !gt.images || gt.images.length === 0) {
          throw new ValidationError(ErrorJob.GroundThuthValidationFailed);
        }

        gtEntries = 0;
        gt.images.forEach((gtImage: CvatImageData) => {
          const { id } = points.images.find(
            (dataImage: CvatImageData) =>
              dataImage.file_name === gtImage.file_name,
          );

          if (id) {
            const matchingAnnotations = points.annotations.filter(
              (dataAnnotation: CvatAnnotationData) =>
                dataAnnotation.image_id === id,
            );
            gtEntries += matchingAnnotations.length;
          }
        });

        return points.annotations.length - gtEntries;
      }

      case CvatJobType.IMAGE_SKELETONS_FROM_BOXES: {
        const boxes = (await this.storageService.downloadJsonLikeData(
          urls.boxesUrl!.href,
        )) as any;
        gt = (await this.storageService.downloadJsonLikeData(
          urls.gtUrl.href,
        )) as any;

        if (!gt || !gt.images || gt.images.length === 0) {
          throw new ValidationError(ErrorJob.GroundThuthValidationFailed);
        }

        gtEntries = 0;
        gt.images.forEach((gtImage: CvatImageData) => {
          const { id } = boxes.images.find(
            (dataImage: CvatImageData) =>
              dataImage.file_name === gtImage.file_name,
          );

          if (id) {
            const matchingAnnotations = boxes.annotations.filter(
              (dataAnnotation: CvatAnnotationData) =>
                dataAnnotation.image_id === id,
            );
            gtEntries += matchingAnnotations.length;
          }
        });

        return boxes.annotations.length - gtEntries;
      }

      default:
        throw new ValidationError(ErrorJob.InvalidRequestType);
    }
  }

  private async checkImageConsistency(
    gtImages: any[],
    dataFiles: string[],
  ): Promise<void> {
    const gtFileNames = gtImages.map((image: any) => image.file_name);
    const baseFileNames = dataFiles.map((fileName) =>
      fileName.split('/').pop(),
    );
    const missingFileNames = gtFileNames.filter(
      (fileName: any) => !baseFileNames.includes(fileName),
    );

    if (missingFileNames.length !== 0) {
      throw new ConflictError(ErrorJob.ImageConsistency);
    }
  }

  private async calculateCvatJobBounty(
    params: CvatCalculateJobBounty,
  ): Promise<string> {
    const { requestType, fundAmount, urls, nodesTotal } = params;

    const elementsCount = await this.getCvatElementsCount(urls, requestType);

    let jobSize = Number(this.cvatConfigService.jobSize);

    if (requestType === CvatJobType.IMAGE_SKELETONS_FROM_BOXES) {
      const jobSizeMultiplier = Number(
        this.cvatConfigService.skeletonsJobSizeMultiplier,
      );
      jobSize *= jobSizeMultiplier;
    }

    let totalJobs: number;

    // For each skeleton node CVAT creates a separate project thus increasing the number of jobs
    if (requestType === CvatJobType.IMAGE_SKELETONS_FROM_BOXES && nodesTotal) {
      totalJobs = Math.ceil(elementsCount / jobSize) * nodesTotal;
    } else {
      totalJobs = Math.ceil(elementsCount / jobSize);
    }

    const jobBounty =
      ethers.parseUnits(fundAmount.toString(), params.decimals) /
      BigInt(totalJobs);

    return ethers.formatUnits(jobBounty, params.decimals);
  }

  private async createCvatManifest(
    dto: JobCvatDto,
    requestType: CvatJobType,
    tokenFundAmount: number,
    decimals: number,
  ): Promise<CvatManifestDto> {
    if (
      (requestType === CvatJobType.IMAGE_SKELETONS_FROM_BOXES &&
        !dto.data.boxes) ||
      (requestType === CvatJobType.IMAGE_BOXES_FROM_POINTS && !dto.data.points)
    ) {
      throw new ConflictError(ErrorJob.DataNotExist);
    }

    const urls = {
      dataUrl: generateBucketUrl(dto.data.dataset, requestType),
      gtUrl: generateBucketUrl(dto.groundTruth, requestType),
      boxesUrl: dto.data.boxes
        ? generateBucketUrl(dto.data.boxes, requestType)
        : undefined,
      pointsUrl: dto.data.points
        ? generateBucketUrl(dto.data.points, requestType)
        : undefined,
    };

    const jobBounty = await this.calculateCvatJobBounty({
      requestType,
      fundAmount: tokenFundAmount,
      decimals,
      urls,
      nodesTotal: dto.labels[0]?.nodes?.length,
    });

    return {
      data: {
        data_url: urls.dataUrl.href,
        ...(urls.pointsUrl && {
          points_url: urls.pointsUrl?.href,
        }),
        ...(urls.boxesUrl && {
          boxes_url: urls.boxesUrl?.href,
        }),
      },
      annotation: {
        labels: dto.labels,
        description: dto.requesterDescription,
        user_guide: dto.userGuide,
        type: requestType as CvatJobType,
        job_size: this.cvatConfigService.jobSize,
        ...(dto.qualifications && {
          qualifications: dto.qualifications,
        }),
      },
      validation: {
        min_quality: dto.minQuality,
        val_size: this.cvatConfigService.valSize,
        gt_url: urls.gtUrl.href,
      },
      job_bounty: jobBounty,
    };
  }

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
      const encryptedManifest = await this.encryption.signAndEncrypt(
        JSON.stringify(data),
        publicKeys,
      );
      manifestFile = encryptedManifest;
    }

    return this.storageService.uploadJsonLikeData(manifestFile);
  }

  private async validateManifest(
    requestType: JobRequestType,
    manifest: FortuneManifestDto | CvatManifestDto | HCaptchaManifestDto,
  ): Promise<void> {
    let dtoCheck;

    if (requestType === FortuneJobType.FORTUNE) {
      dtoCheck = new FortuneManifestDto();
    } else if (requestType === HCaptchaJobType.HCAPTCHA) {
      return;
      dtoCheck = new HCaptchaManifestDto();
    } else {
      dtoCheck = new CvatManifestDto();
    }

    Object.assign(dtoCheck, manifest);

    const validationErrors: ClassValidationError[] = await validate(dtoCheck);
    if (validationErrors.length > 0) {
      throw new ValidationError(ErrorJob.ManifestValidationFailed);
    }
  }

  async downloadManifest(
    manifestUrl: string,
    requestType: JobRequestType,
  ): Promise<FortuneManifestDto | CvatManifestDto | HCaptchaManifestDto> {
    const manifest = (await this.storageService.downloadJsonLikeData(
      manifestUrl,
    )) as ManifestDto;

    await this.validateManifest(requestType, manifest);

    return manifest;
  }
}
