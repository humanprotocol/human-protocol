import { JobManifest } from '../common/interfaces/manifest';
import { JobRequestType } from '../common/enums';
import { UnsupportedManifestTypeError } from '../common/errors/manifest';

export function getJobRequestType(manifest: JobManifest): JobRequestType {
  let jobRequestType: JobRequestType | undefined;

  if ('requestType' in manifest) {
    jobRequestType = manifest.requestType;
  } else if ('annotation' in manifest) {
    jobRequestType = manifest.annotation.type;
  }

  if (!jobRequestType) {
    throw new UnsupportedManifestTypeError(jobRequestType);
  }

  return jobRequestType;
}
