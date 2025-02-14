import { CvatManifest, FortuneManifest } from '../common/interfaces/manifest';
import { JobRequestType } from '../common/enums';
import { UnsupportedManifestTypeError } from '../common/errors/manifest';

export function getRequestType(
  manifest: FortuneManifest | CvatManifest,
): JobRequestType {
  const requestType =
    (manifest as FortuneManifest).requestType ||
    ((manifest as CvatManifest).annotation &&
      (manifest as CvatManifest).annotation.type);

  if (!requestType) {
    throw new UnsupportedManifestTypeError(requestType);
  }

  return requestType;
}
