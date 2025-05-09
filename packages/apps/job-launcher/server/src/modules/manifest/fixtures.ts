import { faker } from '@faker-js/faker';
import { JobCvatDto, JobAudinoDto, JobCaptchaDto } from '../job/job.dto';
import { AWSRegions, StorageProviders } from '../../common/enums/storage';
import { ChainId } from '@human-protocol/sdk';
import { PaymentCurrency } from '../../common/enums/payment';
import {
  AudinoJobType,
  CvatJobType,
  EscrowFundToken,
  JobCaptchaShapeType,
} from '../../common/enums/job';
import { CvatConfigService } from '../../common/config/cvat-config.service';
import { AuthConfigService } from '../../common/config/auth-config.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';

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

export function getMockedProvider(): StorageProviders {
  return faker.helpers.arrayElement(
    Object.values(StorageProviders).filter(
      (provider) => provider !== StorageProviders.LOCAL,
    ),
  );
}

export function getMockedRegion(): AWSRegions {
  return faker.helpers.arrayElement(Object.values(AWSRegions));
}

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
    audioDuration: faker.number.int({ min: 100, max: 1000 }),
    segmentDuration: faker.number.int({ min: 10, max: 100 }),
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
