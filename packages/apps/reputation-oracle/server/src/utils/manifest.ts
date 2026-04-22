import { CvatJobType, FortuneJobType, MarketingJobType } from '@/common/enums';
import { JobManifest, JobRequestType } from '@/common/types';

const fortuneJobTypes = Object.values(FortuneJobType);

export function isFortuneJobType(value: string): value is FortuneJobType {
  return fortuneJobTypes.includes(value as FortuneJobType);
}

const marketingJobTypes = Object.values(MarketingJobType);

export function isMarketingJobType(value: string): value is MarketingJobType {
  return marketingJobTypes.includes(value as MarketingJobType);
}

const cvatJobTypes = Object.values(CvatJobType);

export function isCvatJobType(value: string): value is CvatJobType {
  return cvatJobTypes.includes(value as CvatJobType);
}

const validJobRequestTypes: string[] = [
  ...fortuneJobTypes,
  ...marketingJobTypes,
  ...cvatJobTypes,
];

function assertValidJobRequestType(
  value: string,
): asserts value is JobRequestType {
  if (validJobRequestTypes.includes(value)) {
    return;
  }

  throw new Error(`Unsupported request type: ${value}`);
}

export function getJobRequestType(manifest: JobManifest): JobRequestType {
  let jobRequestType: string | undefined;

  if ('requestType' in manifest) {
    jobRequestType = manifest.requestType;
  } else if ('job_type' in manifest) {
    jobRequestType = manifest.job_type;
  } else if ('annotation' in manifest) {
    jobRequestType = manifest.annotation.type;
  }

  if (!jobRequestType) {
    throw new Error(`Job request type is missing in manifest`);
  }

  assertValidJobRequestType(jobRequestType);

  return jobRequestType;
}
