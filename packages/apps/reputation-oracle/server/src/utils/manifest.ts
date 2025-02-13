import { CvatManifestDto, FortuneManifestDto } from '../common/dto/manifest';
import { JobRequestType } from '../common/enums';
import { UnsupportedManifestTypeError } from '../common/errors/manifest';

export function getRequestType(
  manifest: FortuneManifestDto | CvatManifestDto,
): JobRequestType {
  const requestType =
    (manifest as FortuneManifestDto).requestType ||
    ((manifest as CvatManifestDto).annotation &&
      (manifest as CvatManifestDto).annotation.type);

  if (!requestType) {
    throw new UnsupportedManifestTypeError(requestType);
  }

  return requestType;
}
