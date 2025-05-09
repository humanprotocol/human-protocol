import { AudinoJobType, CvatJobType, FortuneJobType } from '../common/enums';
import { JobManifest, JobRequestType } from '../common/types';

const fortuneJobTypes = Object.values(FortuneJobType);

export function isFortuneJobType(value: string): value is FortuneJobType {
  return fortuneJobTypes.includes(value as FortuneJobType);
}

const cvatJobTypes = Object.values(CvatJobType);

export function isCvatJobType(value: string): value is CvatJobType {
  return cvatJobTypes.includes(value as CvatJobType);
}

const audinoJobTypes = Object.values(AudinoJobType);

export function isAudinoJobType(value: string): value is AudinoJobType {
  return audinoJobTypes.includes(value as AudinoJobType);
}

const validJobRequestTypes: string[] = [
  ...fortuneJobTypes,
  ...cvatJobTypes,
  ...audinoJobTypes,
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
  } else if ('annotation' in manifest) {
    jobRequestType = manifest.annotation.type;
  }

  if (!jobRequestType) {
    throw new Error(`Job request type is missing in manifest`);
  }

  assertValidJobRequestType(jobRequestType);

  return jobRequestType;
}
