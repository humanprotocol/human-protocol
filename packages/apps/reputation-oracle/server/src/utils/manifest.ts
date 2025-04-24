import { JobRequestType } from '../common/enums';
import { JobManifest } from '../common/types';
import { UnsupportedManifestTypeError } from '../common/errors/manifest';

export function getJobRequestType(manifest: JobManifest): string {
  let jobRequestType: string | undefined;

  if ('requestType' in manifest) {
    jobRequestType = manifest.requestType;
  } else if ('annotation' in manifest) {
    jobRequestType = manifest.annotation.type;
  }

  if (!jobRequestType) {
    throw new UnsupportedManifestTypeError(jobRequestType);
  }

  return jobRequestType.toLowerCase();
}

export function assertValidJobRequestType(
  value: string,
): asserts value is JobRequestType {
  const validValues = Object.values<string>(JobRequestType);

  if (validValues.includes(value)) {
    return;
  }

  throw new Error(`Unsupported request type: ${value}`);
}
