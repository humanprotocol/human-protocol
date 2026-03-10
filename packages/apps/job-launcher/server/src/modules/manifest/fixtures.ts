import { faker } from '@faker-js/faker';
import { ChainId } from '@human-protocol/sdk';
import { CvatConfigService } from '../../common/config/cvat-config.service';
import { CvatJobType, EscrowFundToken } from '../../common/enums/job';
import { PaymentCurrency } from '../../common/enums/payment';
import { JobCvatDto } from '../job/job.dto';
import {
  getMockedProvider,
  getMockedRegion,
} from '../../../test/fixtures/storage';
import { CvatManifestDto, FortuneManifestDto } from './manifest.dto';
import { FortuneJobType } from '../../common/enums/job';

export const mockCvatConfigService: Omit<CvatConfigService, 'configService'> = {
  jobSize: faker.number.int({ min: 1, max: 1000 }),
  maxTime: faker.number.int({ min: 1, max: 1000 }),
  valSize: faker.number.int({ min: 1, max: 1000 }),
  skeletonsJobSizeMultiplier: faker.number.int({ min: 1, max: 1000 }),
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
