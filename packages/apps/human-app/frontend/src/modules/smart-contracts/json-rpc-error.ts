import { t } from 'i18next';

export class JsonRpcError extends Error {
  metadata: unknown;
  constructor(metadata: unknown) {
    console.error(metadata);
    super(t('errors.jsonRpcError'));
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
    this.metadata = metadata;
  }
}
