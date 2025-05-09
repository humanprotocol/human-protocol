import { faker } from '@faker-js/faker';

import { FortuneJobType } from '../../../common/enums';
import { FortuneFinalResult, FortuneManifest } from '../../../common/types';

export function generateFortuneManifest(): FortuneManifest {
  return {
    requestType: FortuneJobType.FORTUNE,
    fundAmount: Number(faker.finance.amount()),
    submissionsRequired: faker.number.int({ min: 2, max: 5 }),
  };
}

export function generateFortuneSolution(error?: string): FortuneFinalResult {
  return {
    workerAddress: faker.finance.ethereumAddress(),
    solution: faker.string.sample(),
    error: error as FortuneFinalResult['error'],
  };
}
