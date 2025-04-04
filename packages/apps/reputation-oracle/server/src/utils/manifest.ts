import {
  AudinoManifest,
  CvatManifest,
  FortuneManifest,
} from '../common/interfaces/manifest';
import { JobRequestType } from '../common/enums';
import { UnsupportedManifestTypeError } from '../common/errors/manifest';

export function getRequestType(
  manifest: FortuneManifest | CvatManifest | AudinoManifest,
): JobRequestType {
  let requestType: JobRequestType | undefined;

  if ('requestType' in manifest) {
    requestType = manifest.requestType;
  } else if ('annotation' in manifest) {
    requestType = manifest.annotation.type;
  }

  if (!requestType) {
    throw new UnsupportedManifestTypeError(requestType);
  }

  return requestType;
}
