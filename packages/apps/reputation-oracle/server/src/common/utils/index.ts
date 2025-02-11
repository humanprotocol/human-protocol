import * as crypto from 'crypto';
import { Readable } from 'stream';
import { CvatManifestDto, FortuneManifestDto } from '../dto/manifest';
import { JobRequestType } from '../enums';
import { UnsupportedManifestTypeError } from '../errors/manifest';

export function hashStream(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha1');

    stream.on('data', (chunk) => {
      hash.update(chunk);
    });

    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });

    stream.on('error', (error) => {
      reject(error);
    });
  });
}

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

export function assertValidJobRequestType(
  value: string,
): asserts value is JobRequestType {
  const validValues = Object.values<string>(JobRequestType);

  if (validValues.includes(value)) {
    return;
  }

  throw new Error(`Unsupported request type: ${value}`);
}
