import * as crypto from 'crypto';
import { Readable } from 'stream';
import { ErrorManifest } from '../constants/errors';
import { CvatManifestDto, FortuneManifestDto } from '../dto/manifest';
import { JobRequestType } from '../enums';
import { ControlledError } from '../errors/controlled';
import { HttpStatus } from '@nestjs/common';

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
      (manifest as CvatManifestDto).annotation.type) ||
    null;

  if (!requestType) {
    throw new ControlledError(
      ErrorManifest.UnsupportedManifestType,
      HttpStatus.BAD_REQUEST,
    );
  }

  return requestType;
}
