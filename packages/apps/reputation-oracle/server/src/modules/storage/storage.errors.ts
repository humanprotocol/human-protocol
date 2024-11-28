import { BaseError } from '../../common/errors/base';

export class FileDownloadError extends BaseError {
  public readonly location: string;

  constructor(location: string, cause?: unknown) {
    super('Failed to download file', cause);

    this.location = location;
  }
}

export class InvalidFileUrl extends FileDownloadError {
  constructor(url: string) {
    super(url);
    this.message = 'Invalid file URL';
  }
}

export class FileNotFoundError extends FileDownloadError {
  constructor(location: string) {
    super(location);
    this.message = 'File not found';
  }
}
