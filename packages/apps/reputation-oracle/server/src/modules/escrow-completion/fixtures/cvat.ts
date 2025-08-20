import { faker } from '@faker-js/faker';

import { CvatJobType } from '@/common/enums';
import { CvatManifest } from '@/common/types';

export function generateCvatManifest(): CvatManifest {
  return {
    annotation: {
      type: faker.helpers.arrayElement(Object.values(CvatJobType)),
    },
    validation: {
      min_quality: faker.number.float({ min: 0.1, max: 0.9 }),
    },
    job_bounty: faker.finance.amount({ max: 42 }),
  };
}
