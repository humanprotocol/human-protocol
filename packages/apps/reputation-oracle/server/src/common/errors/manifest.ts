import { BaseError } from './base';

class ManifestError extends BaseError {}

export class MissingManifestUrlError extends ManifestError {
  constructor(readonly escrowAddress: string) {
    super('Manifest url is missing for escrow');
  }
}
