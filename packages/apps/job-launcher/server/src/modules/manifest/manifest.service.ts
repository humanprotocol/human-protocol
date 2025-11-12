import {
  ChainId,
  Encryption,
  KVStoreUtils,
  StorageParams,
} from '@human-protocol/sdk';
import {
  ValidationError as ClassValidationError,
  Injectable,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { AuthConfigService } from '../../common/config/auth-config.service';
import { CvatConfigService } from '../../common/config/cvat-config.service';
import { PGPConfigService } from '../../common/config/pgp-config.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import {
  HCAPTCHA_BOUNDING_BOX_MAX_POINTS,
  HCAPTCHA_BOUNDING_BOX_MIN_POINTS,
  HCAPTCHA_IMMO_MAX_LENGTH,
  HCAPTCHA_IMMO_MIN_LENGTH,
  HCAPTCHA_LANDMARK_MAX_POINTS,
  HCAPTCHA_LANDMARK_MIN_POINTS,
  HCAPTCHA_MAX_SHAPES_PER_IMAGE,
  HCAPTCHA_MINIMUM_SELECTION_AREA_PER_SHAPE,
  HCAPTCHA_MIN_SHAPES_PER_IMAGE,
  HCAPTCHA_NOT_PRESENTED_LABEL,
  HCAPTCHA_ORACLE_STAKE,
  HCAPTCHA_POLYGON_MAX_POINTS,
  HCAPTCHA_POLYGON_MIN_POINTS,
} from '../../common/constants';
import { ErrorJob } from '../../common/constants/errors';
import {
  AudinoJobType,
  CvatJobType,
  FortuneJobType,
  HCaptchaJobType,
  JobCaptchaMode,
  JobCaptchaRequestType,
  JobCaptchaShapeType,
  JobRequestType,
} from '../../common/enums/job';
import { ConflictError, ValidationError } from '../../common/errors';
import {
  generateBucketUrl,
  listObjectsInBucket,
} from '../../common/utils/storage';
import {
  CreateJob,
  JobAudinoDto,
  JobCaptchaAdvancedDto,
  JobCaptchaDto,
  JobCvatDto,
} from '../job/job.dto';
import {
  CvatAnnotationData,
  CvatCalculateJobBounty,
  CvatImageData,
  GenerateUrls,
} from '../job/job.interface';
import { StorageService } from '../storage/storage.service';
import { Web3Service } from '../web3/web3.service';
import {
  AudinoManifestDto,
  CvatManifestDto,
  FortuneManifestDto,
  HCaptchaManifestDto,
  ManifestDto,
  RestrictedAudience,
} from './manifest.dto';

@Injectable()
export class ManifestService {
  public readonly storageParams: StorageParams;
  public readonly bucket: string;

  constructor(
    private readonly web3Service: Web3Service,
    private readonly authConfigService: AuthConfigService,
    private readonly web3ConfigService: Web3ConfigService,
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
      case HCaptchaJobType.HCAPTCHA:
        return this.createHCaptchaManifest(dto as JobCaptchaDto);

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

      case AudinoJobType.AUDIO_TRANSCRIPTION:
      case AudinoJobType.AUDIO_ATTRIBUTE_ANNOTATION:
        return this.createAudinoManifest(dto as JobAudinoDto, requestType);

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

  private async createAudinoManifest(
    dto: JobAudinoDto,
    requestType: AudinoJobType,
  ): Promise<AudinoManifestDto> {
    return {
      annotation: {
        description: dto.requesterDescription,
        labels: dto.labels,
        qualifications: dto.qualifications || [],
        type: requestType,
        user_guide: dto.userGuide,
        segment_duration: dto.segmentDuration,
      },
      data: {
        data_url: generateBucketUrl(dto.data.dataset, requestType).href,
      },
      validation: {
        gt_url: generateBucketUrl(dto.groundTruth, requestType).href,
        min_quality: dto.minQuality,
      },
    };
  }

  private async createHCaptchaManifest(
    jobDto: JobCaptchaDto,
  ): Promise<HCaptchaManifestDto> {
    const jobType = jobDto.annotations.typeOfJob;
    const dataUrl = generateBucketUrl(jobDto.data, HCaptchaJobType.HCAPTCHA);
    const objectsInBucket = await listObjectsInBucket(dataUrl);

    const commonManifestProperties = {
      job_mode: JobCaptchaMode.BATCH,
      requester_accuracy_target: jobDto.accuracyTarget,
      request_config: {},
      restricted_audience: this.buildHCaptchaRestrictedAudience(
        jobDto.advanced,
      ),
      requester_max_repeats: jobDto.maxRequests,
      requester_min_repeats: jobDto.minRequests,
      requester_question: { en: jobDto.annotations.labelingPrompt },
      job_total_tasks: objectsInBucket.length,
      task_bid_price: jobDto.annotations.taskBidPrice,
      taskdata_uri: await this.generateAndUploadTaskData(
        dataUrl.href,
        objectsInBucket,
      ),
      public_results: true,
      oracle_stake: HCAPTCHA_ORACLE_STAKE,
      repo_uri: this.web3ConfigService.hCaptchaReputationOracleURI,
      ro_uri: this.web3ConfigService.hCaptchaRecordingOracleURI,
      ...(jobDto.qualifications && {
        qualifications: jobDto.qualifications,
      }),
    };

    let groundTruthsData;
    if (jobDto.annotations.groundTruths) {
      groundTruthsData = await this.storageService.downloadJsonLikeData(
        jobDto.annotations.groundTruths,
      );
    }

    switch (jobType) {
      case JobCaptchaShapeType.COMPARISON:
        return {
          ...commonManifestProperties,
          request_type: JobCaptchaRequestType.IMAGE_LABEL_BINARY,
          groundtruth_uri: jobDto.annotations.groundTruths,
          requester_restricted_answer_set: {},
          requester_question_example: jobDto.annotations.exampleImages || [],
        };

      case JobCaptchaShapeType.CATEGORIZATION:
        return {
          ...commonManifestProperties,
          request_type: JobCaptchaRequestType.IMAGE_LABEL_MULTIPLE_CHOICE,
          groundtruth_uri: jobDto.annotations.groundTruths,
          requester_restricted_answer_set:
            this.buildHCaptchaRestrictedAnswerSet(groundTruthsData),
        };

      case JobCaptchaShapeType.POLYGON:
        if (!jobDto.annotations.label) {
          throw new ValidationError(ErrorJob.JobParamsValidationFailed);
        }

        return {
          ...commonManifestProperties,
          request_type: JobCaptchaRequestType.IMAGE_LABEL_AREA_SELECT,
          request_config: {
            shape_type: JobCaptchaShapeType.POLYGON,
            min_shapes_per_image: HCAPTCHA_MIN_SHAPES_PER_IMAGE,
            max_shapes_per_image: HCAPTCHA_MAX_SHAPES_PER_IMAGE,
            min_points: HCAPTCHA_POLYGON_MIN_POINTS,
            max_points: HCAPTCHA_POLYGON_MAX_POINTS,
            minimum_selection_area_per_shape:
              HCAPTCHA_MINIMUM_SELECTION_AREA_PER_SHAPE,
          },
          groundtruth_uri: jobDto.annotations.groundTruths,
          requester_restricted_answer_set: {
            [jobDto.annotations.label!]: { en: jobDto.annotations.label },
          },
          requester_question_example: jobDto.annotations.exampleImages || [],
        };

      case JobCaptchaShapeType.POINT:
        if (!jobDto.annotations.label) {
          throw new ValidationError(ErrorJob.JobParamsValidationFailed);
        }

        return {
          ...commonManifestProperties,
          request_type: JobCaptchaRequestType.IMAGE_LABEL_AREA_SELECT,
          request_config: {
            shape_type: jobType,
            min_shapes_per_image: HCAPTCHA_MIN_SHAPES_PER_IMAGE,
            max_shapes_per_image: HCAPTCHA_MAX_SHAPES_PER_IMAGE,
            min_points: HCAPTCHA_LANDMARK_MIN_POINTS,
            max_points: HCAPTCHA_LANDMARK_MAX_POINTS,
          },
          groundtruth_uri: jobDto.annotations.groundTruths,
          requester_restricted_answer_set: {
            [jobDto.annotations.label!]: { en: jobDto.annotations.label },
          },
          requester_question_example: jobDto.annotations.exampleImages || [],
        };

      case JobCaptchaShapeType.BOUNDING_BOX:
        if (!jobDto.annotations.label) {
          throw new ValidationError(ErrorJob.JobParamsValidationFailed);
        }

        return {
          ...commonManifestProperties,
          request_type: JobCaptchaRequestType.IMAGE_LABEL_AREA_SELECT,
          request_config: {
            shape_type: jobType,
            min_shapes_per_image: HCAPTCHA_MIN_SHAPES_PER_IMAGE,
            max_shapes_per_image: HCAPTCHA_MAX_SHAPES_PER_IMAGE,
            min_points: HCAPTCHA_BOUNDING_BOX_MIN_POINTS,
            max_points: HCAPTCHA_BOUNDING_BOX_MAX_POINTS,
          },
          groundtruth_uri: jobDto.annotations.groundTruths,
          requester_restricted_answer_set: {
            [jobDto.annotations.label!]: { en: jobDto.annotations.label },
          },
          requester_question_example: jobDto.annotations.exampleImages || [],
        };

      case JobCaptchaShapeType.IMMO:
        if (!jobDto.annotations.label) {
          throw new ValidationError(ErrorJob.JobParamsValidationFailed);
        }

        return {
          ...commonManifestProperties,
          request_type: JobCaptchaRequestType.TEXT_FREEE_NTRY,
          request_config: {
            multiple_choice_max_choices: 1,
            multiple_choice_min_choices: 1,
            overlap_threshold: null,
            answer_type: 'str',
            max_length: HCAPTCHA_IMMO_MAX_LENGTH,
            min_length: HCAPTCHA_IMMO_MIN_LENGTH,
          },
          requester_restricted_answer_set: {
            [jobDto.annotations.label!]: { en: jobDto.annotations.label },
          },
          taskdata: [],
        };

      default:
        throw new ValidationError(ErrorJob.HCaptchaInvalidJobType);
    }
  }

  private buildHCaptchaRestrictedAudience(advanced: JobCaptchaAdvancedDto) {
    const restrictedAudience: RestrictedAudience = {};

    restrictedAudience.sitekey = [
      {
        [this.authConfigService.hCaptchaSiteKey]: {
          score: 1,
        },
      },
    ];

    if (advanced.workerLanguage) {
      restrictedAudience.lang = [{ [advanced.workerLanguage]: { score: 1 } }];
    }

    if (advanced.workerLocation) {
      restrictedAudience.country = [
        { [advanced.workerLocation]: { score: 1 } },
      ];
    }

    if (advanced.targetBrowser) {
      restrictedAudience.browser = [{ [advanced.targetBrowser]: { score: 1 } }];
    }

    return restrictedAudience;
  }

  private buildHCaptchaRestrictedAnswerSet(groundTruthsData: any) {
    const maxElements = 3;
    const outputObject: any = {};

    let elementCount = 0;

    for (const key of Object.keys(groundTruthsData)) {
      if (elementCount >= maxElements) {
        break;
      }

      const value = groundTruthsData[key][0][0];
      outputObject[value] = { en: value, answer_example_uri: key };
      elementCount++;
    }

    // Default case
    outputObject['0'] = { en: HCAPTCHA_NOT_PRESENTED_LABEL };

    return outputObject;
  }

  private async generateAndUploadTaskData(
    dataUrl: string,
    objectNames: string[],
  ) {
    const data = objectNames.map((objectName) => {
      return {
        datapoint_uri: `${dataUrl}/${objectName}`,
        datapoint_hash: 'undefined-hash',
        task_key: uuidv4(),
      };
    });

    const { url } = await this.storageService.uploadJsonLikeData(data);

    return url;
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
    manifest:
      | FortuneManifestDto
      | CvatManifestDto
      | HCaptchaManifestDto
      | AudinoManifestDto,
  ): Promise<void> {
    let dtoCheck;

    if (requestType === FortuneJobType.FORTUNE) {
      dtoCheck = new FortuneManifestDto();
    } else if (requestType === HCaptchaJobType.HCAPTCHA) {
      return;
      dtoCheck = new HCaptchaManifestDto();
    } else if (
      Object.values(AudinoJobType).includes(requestType as AudinoJobType)
    ) {
      dtoCheck = new AudinoManifestDto();
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
  ): Promise<
    | FortuneManifestDto
    | CvatManifestDto
    | HCaptchaManifestDto
    | AudinoManifestDto
  > {
    const manifest = (await this.storageService.downloadJsonLikeData(
      manifestUrl,
    )) as ManifestDto;

    await this.validateManifest(requestType, manifest);

    return manifest;
  }
}
