import { faker } from '@faker-js/faker';

import { FortuneJobType } from '@/common/enums';
import {
  FortuneFinalResult,
  FortuneManifest,
  VerificationResult,
} from '@/common/types';

export function generateFortuneManifest(): FortuneManifest {
  return {
    jobType: FortuneJobType.FORTUNE,
    submissionsRequired: faker.number.int({ min: 2, max: 5 }),
  };
}

export function generateFortuneSolution(
  rejectionReason?: string,
): FortuneFinalResult {
  return {
    workerAddress: faker.finance.ethereumAddress(),
    solution: faker.string.sample(),
    verificationResult: rejectionReason
      ? VerificationResult.Rejected
      : VerificationResult.Accepted,
    ...(rejectionReason ? { rejectionReason } : {}),
  };
}
