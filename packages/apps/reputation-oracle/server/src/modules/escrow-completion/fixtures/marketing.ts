import { faker } from '@faker-js/faker';

import { MarketingJobType } from '@/common/enums';
import {
  VerificationResult,
  MarketingFinalResult,
  MarketingManifest,
} from '@/common/types';

export function generateMarketingManifest(): MarketingManifest {
  return {
    job_type: MarketingJobType.SOCIAL_MEDIA_PROMOTION,
    submissions_required: faker.number.int({ min: 2, max: 5 }),
  };
}

export function generateMarketingResult(
  verificationResult: MarketingFinalResult['verificationResult'] = VerificationResult.Accepted,
): MarketingFinalResult {
  return {
    workerAddress: faker.finance.ethereumAddress(),
    postUrl: `https://x.com/${faker.internet.username().replace(/_/g, '')}/status/${faker.number.int({ min: 1000, max: 999999999 })}`,
    verificationResult,
    ...(verificationResult === VerificationResult.Rejected
      ? { rejectionReason: faker.lorem.word() }
      : {}),
  };
}
