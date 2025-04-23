import { JobManifest } from '../common/interfaces/manifest';
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
