import { BaseError } from './base';

class ManifestError extends BaseError {}

export class MissingManifestUrlError extends ManifestError {
  constructor(public readonly escrowAddress: string) {
    super('Manifest url is missing for escrow');
  }
}

export class UnsupportedManifestTypeError extends ManifestError {
  constructor(public readonly manifestType: unknown) {
    super('Unsupported manifest type');
  }
}
