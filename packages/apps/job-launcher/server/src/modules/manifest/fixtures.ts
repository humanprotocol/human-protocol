import { faker } from '@faker-js/faker';
import { CvatJobType, FortuneJobType } from '../../common/enums/job';
import { CvatManifestDto, FortuneManifestDto } from './manifest.dto';

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
