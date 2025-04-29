/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  ChainId,
  Encryption,
  KVStoreUtils,
  StorageParams,
} from '@human-protocol/sdk';
import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  ValidationError,
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
  JobCaptchaMode,
  JobCaptchaRequestType,
  JobCaptchaShapeType,
  JobRequestType,
} from '../../common/enums/job';
import { ControlledError } from '../../common/errors/controlled';
import {
  generateBucketUrl,
  listObjectsInBucket,
} from '../../common/utils/storage';
import {
  CreateJob,
  CvatDataDto,
  JobAudinoDto,
  JobCaptchaAdvancedDto,
  JobCaptchaDto,
  JobCvatDto,
  StorageDataDto,
} from '../job/job.dto';
import {
  CvatAnnotationData,
  CvatCalculateJobBounty,
  CvatImageData,
  GenerateUrls,
  ManifestAction,
} from '../job/job.interface';
import { StorageService } from '../storage/storage.service';
import { Web3Service } from '../web3/web3.service';
import {
  AudinoManifestDto,
  CvatManifestDto,
  HCaptchaManifestDto,
  FortuneManifestDto,
  RestrictedAudience,
} from './manifest.dto';

@Injectable()
export class ManifestService {
  public readonly logger = new Logger(ManifestService.name);
  public readonly storageParams: StorageParams;
  public readonly bucket: string;

  constructor(
    @Inject(Web3Service)
    private readonly web3Service: Web3Service,
    private readonly authConfigService: AuthConfigService,
    private readonly web3ConfigService: Web3ConfigService,
    private readonly cvatConfigService: CvatConfigService,
    private readonly pgpConfigService: PGPConfigService,
    private readonly storageService: StorageService,
    @Inject(Encryption) private readonly encryption: Encryption,
  ) {}

  async createManifest(
    dto: CreateJob,
    requestType: JobRequestType,
    fundAmount?: number,
  ): Promise<any> {
    switch (requestType) {
      case JobRequestType.HCAPTCHA:
        return this.createHCaptchaManifest(dto as JobCaptchaDto);

      case JobRequestType.FORTUNE:
        return {
          ...dto,
          requestType,
          fundAmount,
        };

      case JobRequestType.IMAGE_POLYGONS:
      case JobRequestType.IMAGE_BOXES:
      case JobRequestType.IMAGE_POINTS:
      case JobRequestType.IMAGE_BOXES_FROM_POINTS:
      case JobRequestType.IMAGE_SKELETONS_FROM_BOXES:
        return this.createCvatManifest(
          dto as JobCvatDto,
          requestType,
          fundAmount!,
        );

      case JobRequestType.AUDIO_TRANSCRIPTION:
        return this.createAudinoManifest(
          dto as JobAudinoDto,
          requestType,
          fundAmount!,
        );

      default:
        throw new ControlledError(
          ErrorJob.InvalidRequestType,
          HttpStatus.BAD_REQUEST,
        );
    }
  }

  private async createCvatManifest(
    dto: JobCvatDto,
    requestType: JobRequestType,
    tokenFundAmount: number,
  ): Promise<CvatManifestDto> {
    const { generateUrls } = this.createManifestActions[requestType];

    const urls = generateUrls(dto.data, dto.groundTruth);

    const jobBounty = await this.calculateJobBounty({
      requestType,
      fundAmount: tokenFundAmount,
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
        type: requestType,
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
    requestType: JobRequestType,
    tokenFundAmount: number,
  ): Promise<any> {
    const { generateUrls } = this.createManifestActions[requestType];
    const urls = generateUrls(dto.data, dto.groundTruth);
    const totalSegments = Math.ceil(
      (dto.audioDuration * 1000) / dto.segmentDuration,
    );

    const jobBounty =
      ethers.parseUnits(tokenFundAmount.toString(), 'ether') /
      BigInt(totalSegments);

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
        data_url: urls.dataUrl.href,
      },
      job_bounty: ethers.formatEther(jobBounty),
      validation: {
        gt_url: urls.gtUrl.href,
        min_quality: dto.minQuality,
      },
    };
  }

  private async createHCaptchaManifest(
    jobDto: JobCaptchaDto,
  ): Promise<HCaptchaManifestDto> {
    const jobType = jobDto.annotations.typeOfJob;
    const dataUrl = generateBucketUrl(jobDto.data, JobRequestType.HCAPTCHA);
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
          throw new ControlledError(
            ErrorJob.JobParamsValidationFailed,
            HttpStatus.BAD_REQUEST,
          );
        }

        const polygonManifest = {
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

        return polygonManifest;

      case JobCaptchaShapeType.POINT:
        if (!jobDto.annotations.label) {
          throw new ControlledError(
            ErrorJob.JobParamsValidationFailed,
            HttpStatus.BAD_REQUEST,
          );
        }

        const pointManifest = {
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

        return pointManifest;
      case JobCaptchaShapeType.BOUNDING_BOX:
        if (!jobDto.annotations.label) {
          throw new ControlledError(
            ErrorJob.JobParamsValidationFailed,
            HttpStatus.BAD_REQUEST,
          );
        }

        const boundingBoxManifest = {
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

        return boundingBoxManifest;
      case JobCaptchaShapeType.IMMO:
        if (!jobDto.annotations.label) {
          throw new ControlledError(
            ErrorJob.JobParamsValidationFailed,
            HttpStatus.BAD_REQUEST,
          );
        }

        const immoManifest = {
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

        return immoManifest;

      default:
        throw new ControlledError(
          ErrorJob.HCaptchaInvalidJobType,
          HttpStatus.CONFLICT,
        );
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

  private createManifestActions: Record<JobRequestType, ManifestAction> = {
    [JobRequestType.HCAPTCHA]: {
      getElementsCount: async () => 0,
      generateUrls: () => ({ dataUrl: new URL(''), gtUrl: new URL('') }),
    },
    [JobRequestType.FORTUNE]: {
      getElementsCount: async () => 0,
      generateUrls: () => ({ dataUrl: new URL(''), gtUrl: new URL('') }),
    },
    [JobRequestType.IMAGE_POLYGONS]: {
      getElementsCount: async (urls: GenerateUrls) => {
        const gt = (await this.storageService.downloadJsonLikeData(
          `${urls.gtUrl.protocol}//${urls.gtUrl.host}${urls.gtUrl.pathname}`,
        )) as any;
        if (!gt || !gt.images || gt.images.length === 0)
          throw new ControlledError(
            ErrorJob.GroundThuthValidationFailed,
            HttpStatus.BAD_REQUEST,
          );

        const data = await listObjectsInBucket(urls.dataUrl);
        if (!data || data.length === 0 || !data[0])
          throw new ControlledError(
            ErrorJob.DatasetValidationFailed,
            HttpStatus.BAD_REQUEST,
          );

        await this.checkImageConsistency(gt.images, data);

        return data.length - gt.images.length;
      },
      generateUrls: (
        data: CvatDataDto,
        groundTruth: StorageDataDto,
      ): GenerateUrls => {
        const requestType = JobRequestType.IMAGE_POLYGONS;
        return {
          dataUrl: generateBucketUrl(data.dataset, requestType),
          gtUrl: generateBucketUrl(groundTruth, requestType),
        };
      },
    },
    [JobRequestType.IMAGE_BOXES]: {
      getElementsCount: async (urls: GenerateUrls) => {
        const gt = (await this.storageService.downloadJsonLikeData(
          `${urls.gtUrl.protocol}//${urls.gtUrl.host}${urls.gtUrl.pathname}`,
        )) as any;
        if (!gt || !gt.images || gt.images.length === 0)
          throw new ControlledError(
            ErrorJob.GroundThuthValidationFailed,
            HttpStatus.BAD_REQUEST,
          );

        const data = await listObjectsInBucket(urls.dataUrl);
        if (!data || data.length === 0 || !data[0])
          throw new ControlledError(
            ErrorJob.DatasetValidationFailed,
            HttpStatus.BAD_REQUEST,
          );

        await this.checkImageConsistency(gt.images, data);

        return data.length - gt.images.length;
      },
      generateUrls: (
        data: CvatDataDto,
        groundTruth: StorageDataDto,
      ): GenerateUrls => {
        const requestType = JobRequestType.IMAGE_BOXES;
        return {
          dataUrl: generateBucketUrl(data.dataset, requestType),
          gtUrl: generateBucketUrl(groundTruth, requestType),
        };
      },
    },
    [JobRequestType.IMAGE_POINTS]: {
      getElementsCount: async (urls: GenerateUrls) => {
        const gt = (await this.storageService.downloadJsonLikeData(
          `${urls.gtUrl.protocol}//${urls.gtUrl.host}${urls.gtUrl.pathname}`,
        )) as any;
        if (!gt || !gt.images || gt.images.length === 0)
          throw new ControlledError(
            ErrorJob.GroundThuthValidationFailed,
            HttpStatus.BAD_REQUEST,
          );

        const data = await listObjectsInBucket(urls.dataUrl);
        if (!data || data.length === 0 || !data[0])
          throw new ControlledError(
            ErrorJob.DatasetValidationFailed,
            HttpStatus.BAD_REQUEST,
          );

        await this.checkImageConsistency(gt.images, data);

        return data.length - gt.images.length;
      },
      generateUrls: (
        data: CvatDataDto,
        groundTruth: StorageDataDto,
      ): GenerateUrls => {
        const requestType = JobRequestType.IMAGE_POINTS;

        return {
          dataUrl: generateBucketUrl(data.dataset, requestType),
          gtUrl: generateBucketUrl(groundTruth, requestType),
        };
      },
    },
    [JobRequestType.IMAGE_BOXES_FROM_POINTS]: {
      getElementsCount: async (urls: GenerateUrls) =>
        this.getCvatElementsCount(urls.gtUrl, urls.pointsUrl!),
      generateUrls: (
        data: CvatDataDto,
        groundTruth: StorageDataDto,
      ): GenerateUrls => {
        if (!data.points) {
          throw new ControlledError(ErrorJob.DataNotExist, HttpStatus.CONFLICT);
        }

        const requestType = JobRequestType.IMAGE_BOXES_FROM_POINTS;

        return {
          dataUrl: generateBucketUrl(data.dataset, requestType),
          gtUrl: generateBucketUrl(groundTruth, requestType),
          pointsUrl: generateBucketUrl(data.points, requestType),
        };
      },
    },
    [JobRequestType.IMAGE_SKELETONS_FROM_BOXES]: {
      getElementsCount: async (urls: GenerateUrls) =>
        this.getCvatElementsCount(urls.gtUrl, urls.boxesUrl!),
      generateUrls: (
        data: CvatDataDto,
        groundTruth: StorageDataDto,
      ): GenerateUrls => {
        if (!data.boxes) {
          throw new ControlledError(ErrorJob.DataNotExist, HttpStatus.CONFLICT);
        }

        const requestType = JobRequestType.IMAGE_SKELETONS_FROM_BOXES;

        return {
          dataUrl: generateBucketUrl(data.dataset, requestType),
          gtUrl: generateBucketUrl(groundTruth, requestType),
          boxesUrl: generateBucketUrl(data.boxes, requestType),
        };
      },
    },
    [JobRequestType.AUDIO_TRANSCRIPTION]: {
      getElementsCount: async () => 0,
      generateUrls: (
        data: CvatDataDto,
        groundTruth: StorageDataDto,
      ): GenerateUrls => {
        const requestType = JobRequestType.AUDIO_TRANSCRIPTION;

        return {
          dataUrl: generateBucketUrl(data.dataset, requestType),
          gtUrl: generateBucketUrl(groundTruth, requestType),
        };
      },
    },
  };

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
      throw new ControlledError(
        ErrorJob.ImageConsistency,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async getCvatElementsCount(
    gtUrl: URL,
    dataUrl: URL,
  ): Promise<number> {
    const data = (await this.storageService.downloadJsonLikeData(
      dataUrl.href,
    )) as any;
    const gt = (await this.storageService.downloadJsonLikeData(
      gtUrl.href,
    )) as any;

    if (!gt || !gt.images || gt.images.length === 0) {
      throw new ControlledError(
        ErrorJob.GroundThuthValidationFailed,
        HttpStatus.BAD_REQUEST,
      );
    }

    let gtEntries = 0;

    gt.images.forEach((gtImage: CvatImageData) => {
      const { id } = data.images.find(
        (dataImage: CvatImageData) => dataImage.file_name === gtImage.file_name,
      );

      if (id) {
        const matchingAnnotations = data.annotations.filter(
          (dataAnnotation: CvatAnnotationData) =>
            dataAnnotation.image_id === id,
        );
        gtEntries += matchingAnnotations.length;
      }
    });

    return data.annotations.length - gtEntries;
  }

  private async calculateJobBounty(
    params: CvatCalculateJobBounty,
  ): Promise<string> {
    const { requestType, fundAmount, urls, nodesTotal } = params;

    const { getElementsCount } = this.createManifestActions[requestType];
    const elementsCount = await getElementsCount(urls);

    let jobSize = Number(this.cvatConfigService.jobSize);

    if (requestType === JobRequestType.IMAGE_SKELETONS_FROM_BOXES) {
      const jobSizeMultiplier = Number(
        this.cvatConfigService.skeletonsJobSizeMultiplier,
      );
      jobSize *= jobSizeMultiplier;
    }

    let totalJobs: number;

    // For each skeleton node CVAT creates a separate project thus increasing amount of jobs
    if (
      requestType === JobRequestType.IMAGE_SKELETONS_FROM_BOXES &&
      nodesTotal
    ) {
      totalJobs = Math.ceil(elementsCount / jobSize) * nodesTotal;
    } else {
      totalJobs = Math.ceil(elementsCount / jobSize);
    }
    const jobBounty =
      ethers.parseUnits(fundAmount.toString(), 'ether') / BigInt(totalJobs);
    return ethers.formatEther(jobBounty);
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
        await KVStoreUtils.getPublicKey(chainId, signer.address),
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

    if (requestType === JobRequestType.FORTUNE) {
      dtoCheck = new FortuneManifestDto();
    } else if (requestType === JobRequestType.HCAPTCHA) {
      return;
      dtoCheck = new HCaptchaManifestDto();
    } else if (requestType === JobRequestType.AUDIO_TRANSCRIPTION) {
      dtoCheck = new AudinoManifestDto();
    } else {
      dtoCheck = new CvatManifestDto();
    }

    Object.assign(dtoCheck, manifest);

    const validationErrors: ValidationError[] = await validate(dtoCheck);
    if (validationErrors.length > 0) {
      throw new ControlledError(
        ErrorJob.ManifestValidationFailed,
        HttpStatus.NOT_FOUND,
      );
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
    )) as any;

    await this.validateManifest(requestType, manifest);

    return manifest;
  }
}
