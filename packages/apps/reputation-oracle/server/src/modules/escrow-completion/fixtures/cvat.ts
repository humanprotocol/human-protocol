import { faker } from '@faker-js/faker';

import { CvatJobType } from '@/common/enums';
import { CvatManifest } from '@/common/types';

export function generateCvatManifest(): CvatManifest {
  return {
    version: 2,
    job_type: faker.helpers.arrayElement(Object.values(CvatJobType)),
    data: undefined,
    annotation: undefined,
  };
}
