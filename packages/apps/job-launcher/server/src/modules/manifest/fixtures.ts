import { faker } from '@faker-js/faker';
import { ChainId } from '@human-protocol/sdk';
import { AuthConfigService } from '../../common/config/auth-config.service';
import { CvatConfigService } from '../../common/config/cvat-config.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import {
  AudinoJobType,
  CvatJobType,
  EscrowFundToken,
  JobCaptchaRequestType,
  JobCaptchaShapeType,
} from '../../common/enums/job';
import { PaymentCurrency } from '../../common/enums/payment';
import { JobAudinoDto, JobCaptchaDto, JobCvatDto } from '../job/job.dto';
import {
  getMockedProvider,
  getMockedRegion,
} from '../../../test/fixtures/storage';
import {
  AudinoManifestDto,
  CvatManifestDto,
  FortuneManifestDto,
  HCaptchaManifestDto,
} from './manifest.dto';
import { FortuneJobType } from '../../common/enums/job';

export const mockCvatConfigService: Omit<CvatConfigService, 'configService'> = {
  jobSize: faker.number.int({ min: 1, max: 1000 }),
  maxTime: faker.number.int({ min: 1, max: 1000 }),
  valSize: faker.number.int({ min: 1, max: 1000 }),
  skeletonsJobSizeMultiplier: faker.number.int({ min: 1, max: 1000 }),
};

export const mockAuthConfigService: Omit<
  Partial<AuthConfigService>,
  'configService'
> = {
  hCaptchaSiteKey: faker.string.uuid(),
};

export const mockWeb3ConfigService: Omit<
  Partial<Web3ConfigService>,
  'configService'
> = {
  hCaptchaReputationOracleURI: faker.internet.url(),
  hCaptchaRecordingOracleURI: faker.internet.url(),
};

export function createJobCvatDto(
  overrides: Partial<JobCvatDto> = {},
): JobCvatDto {
  return {
    data: {
      dataset: {
        provider: getMockedProvider(),
        region: getMockedRegion(),
        bucketName: faker.lorem.word(),
        path: faker.system.filePath(),
      },
    },
    labels: [{ name: faker.lorem.word(), nodes: [faker.string.uuid()] }],
    requesterDescription: faker.lorem.sentence(),
    userGuide: faker.internet.url(),
    minQuality: faker.number.float({ min: 0.1, max: 1 }),
    groundTruth: {
      provider: getMockedProvider(),
      region: getMockedRegion(),
      bucketName: faker.lorem.word(),
      path: faker.system.filePath(),
    },
    type: CvatJobType.IMAGE_BOXES,
    chainId: faker.helpers.arrayElement(Object.values(ChainId)) as ChainId,
    paymentCurrency: faker.helpers.arrayElement(Object.values(PaymentCurrency)),
    paymentAmount: faker.number.int({ min: 1, max: 1000 }),
    escrowFundToken: faker.helpers.arrayElement(Object.values(EscrowFundToken)),
    ...overrides,
  };
}

export function createJobAudinoDto(
  overrides: Partial<JobAudinoDto> = {},
): JobAudinoDto {
  return {
    data: {
      dataset: {
        provider: getMockedProvider(),
        region: getMockedRegion(),
        bucketName: faker.lorem.word(),
        path: faker.system.filePath(),
      },
    },
    groundTruth: {
      provider: getMockedProvider(),
      region: getMockedRegion(),
      bucketName: faker.lorem.word(),
      path: faker.system.filePath(),
    },
    labels: [{ name: faker.lorem.word() }],
    segmentDuration: faker.number.int({ min: 10, max: 3600000 }),
    requesterDescription: faker.lorem.sentence(),
    userGuide: faker.internet.url(),
    qualifications: [faker.lorem.word()],
    minQuality: faker.number.int({ min: 1, max: 100 }),
    type: AudinoJobType.AUDIO_TRANSCRIPTION,
    paymentCurrency: faker.helpers.arrayElement(Object.values(PaymentCurrency)),
    paymentAmount: faker.number.int({ min: 1, max: 1000 }),
    escrowFundToken: faker.helpers.arrayElement(Object.values(EscrowFundToken)),
    ...overrides,
  };
}

export function createJobCaptchaDto(
  overrides: Partial<JobCaptchaDto> = {},
): JobCaptchaDto {
  return {
    data: {
      provider: getMockedProvider(),
      region: getMockedRegion(),
      bucketName: faker.lorem.word(),
      path: faker.system.filePath(),
    },
    accuracyTarget: faker.number.float({ min: 0.1, max: 1 }),
    minRequests: faker.number.int({ min: 1, max: 5 }),
    maxRequests: faker.number.int({ min: 6, max: 10 }),
    annotations: {
      typeOfJob: faker.helpers.arrayElement(Object.values(JobCaptchaShapeType)),
      labelingPrompt: faker.lorem.sentence(),
      groundTruths: faker.internet.url(),
      exampleImages: [faker.internet.url(), faker.internet.url()],
      taskBidPrice: faker.number.float({ min: 0.1, max: 10 }),
      label: faker.lorem.word(),
    },
    completionDate: faker.date.future(),
    paymentCurrency: faker.helpers.arrayElement(Object.values(PaymentCurrency)),
    paymentAmount: faker.number.int({ min: 1, max: 1000 }),
    escrowFundToken: faker.helpers.arrayElement(Object.values(EscrowFundToken)),
    advanced: {},
    ...overrides,
  };
}

export function createMockFortuneManifest(
  overrides: Partial<FortuneManifestDto> = {},
): FortuneManifestDto {
  return {
    submissionsRequired: faker.number.int({ min: 1, max: 100 }),
    requesterTitle: faker.lorem.sentence(),
    requesterDescription: faker.lorem.sentence(),
    fundAmount: faker.number.int({ min: 1, max: 100000 }),
    requestType: FortuneJobType.FORTUNE,
    ...overrides,
  };
}

export function createMockCvatManifest(
  overrides: Partial<CvatManifestDto> = {},
): CvatManifestDto {
  return {
    data: {
      data_url: faker.internet.url(),
      points_url: faker.datatype.boolean() ? faker.internet.url() : undefined,
      boxes_url: faker.datatype.boolean() ? faker.internet.url() : undefined,
    },
    annotation: {
      labels: [
        {
          name: faker.lorem.word(),
          nodes: [faker.lorem.word(), faker.lorem.word()],
          joints: [faker.lorem.word()],
        },
      ],
      description: faker.lorem.sentence(),
      user_guide: faker.internet.url(),
      type: CvatJobType.IMAGE_BOXES,
      job_size: faker.number.int({ min: 1, max: 100 }),
      qualifications: [faker.lorem.word()],
    },
    validation: {
      min_quality: faker.number.float({ min: 0.1, max: 1 }),
      val_size: faker.number.int({ min: 1, max: 100 }),
      gt_url: faker.internet.url(),
    },
    job_bounty: faker.finance.amount(),
    ...overrides,
  };
}

export function createMockAudinoManifest(
  overrides: Partial<AudinoManifestDto> = {},
): AudinoManifestDto {
  return {
    data: {
      data_url: faker.internet.url(),
    },
    annotation: {
      labels: [{ name: faker.lorem.word() }],
      description: faker.lorem.sentence(),
      user_guide: faker.internet.url(),
      type: AudinoJobType.AUDIO_TRANSCRIPTION,
      segment_duration: faker.number.int({ min: 10, max: 360000 }),
      qualifications: [faker.lorem.word()],
    },
    validation: {
      min_quality: faker.number.float({ min: 0.1, max: 1 }),
      gt_url: faker.internet.url(),
    },
    ...overrides,
  };
}

export function createMockHcaptchaManifest(
  overrides: Partial<HCaptchaManifestDto> = {},
): HCaptchaManifestDto {
  return {
    job_mode: faker.lorem.word(),
    request_type: faker.helpers.arrayElement(
      Object.values(JobCaptchaRequestType),
    ),
    request_config: {
      shape_type: faker.helpers.arrayElement(
        Object.values(JobCaptchaShapeType),
      ),
      min_shapes_per_image: faker.number.int({ min: 1, max: 5 }),
      max_shapes_per_image: faker.number.int({ min: 6, max: 10 }),
      min_points: faker.number.int({ min: 1, max: 5 }),
      max_points: faker.number.int({ min: 6, max: 10 }),
      minimum_selection_area_per_shape: faker.number.int({ min: 1, max: 100 }),
      multiple_choice_max_choices: faker.number.int({ min: 1, max: 5 }),
      multiple_choice_min_choices: faker.number.int({ min: 1, max: 5 }),
      answer_type: faker.lorem.word(),
      overlap_threshold: faker.number.float({ min: 0, max: 1 }),
      max_length: faker.number.int({ min: 1, max: 100 }),
      min_length: faker.number.int({ min: 1, max: 100 }),
    },
    requester_accuracy_target: faker.number.float({ min: 0.1, max: 1 }),
    requester_max_repeats: faker.number.int({ min: 1, max: 10 }),
    requester_min_repeats: faker.number.int({ min: 1, max: 10 }),
    requester_question_example: [faker.internet.url()],
    requester_question: { en: faker.lorem.sentence() },
    taskdata_uri: faker.internet.url(),
    job_total_tasks: faker.number.int({ min: 1, max: 1000 }),
    task_bid_price: faker.number.float({ min: 0.01, max: 10 }),
    groundtruth_uri: faker.internet.url(),
    public_results: faker.datatype.boolean(),
    oracle_stake: faker.number.int({ min: 1, max: 100 }),
    repo_uri: faker.internet.url(),
    ro_uri: faker.internet.url(),
    restricted_audience: {},
    requester_restricted_answer_set: {},
    taskdata: [
      {
        task_key: faker.string.uuid(),
        datapoint_uri: faker.internet.url(),
        datapoint_hash: faker.string.uuid(),
        datapoint_text: { en: faker.lorem.sentence() },
      },
    ],
    qualifications: [faker.lorem.word()],
    ...overrides,
  };
}
