import { BaseError } from '../../common/errors/base';

export enum NdaErrorMessage {
  NDA_NOT_FOUND = 'NDA not found',
  NDA_ALREADY_SIGNED = 'NDA already signed',
}

export class NdaError extends BaseError {
  constructor(message: NdaErrorMessage) {
    super(message);
  }
}

export class NdaNotFoundError extends BaseError {
  constructor(public readonly detail: string | undefined) {
    detail = detail ? `- ${detail}` : '';
    super(`${NdaErrorMessage.NDA_NOT_FOUND}${detail}`);
  }
}

export class NdaSignedError extends BaseError {
  constructor(
    public readonly userId: number,
    public readonly version: string,
  ) {
    super(
      `${NdaErrorMessage.NDA_ALREADY_SIGNED} - userId: ${userId} version: ${version}`,
    );
  }
}
