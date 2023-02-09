import { v4 as uuidv4 } from 'uuid';
import { Manifest, NestedManifest } from './generated/manifest';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validateNumber = (value: any) => {
  if (typeof value !== 'number') {
    throw new Error('Invalid type');
  }

  if (value < 0) {
    throw new Error('Invalid amount');
  }
};

export const validateUUIDString = (value: string) => {
  if (typeof value !== 'string') {
    throw new Error('Invalid type');
  }

  if (
    value.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    ) === null
  ) {
    throw new Error('Invalid UUID');
  }
};

export const validateUUID = <T extends Manifest | NestedManifest>(
  manifest: T,
  field: string
): T => {
  if (!manifest[field]) {
    manifest[field] = uuidv4();
  } else {
    validateUUIDString(manifest[field] as string);
  }

  return manifest;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validateURL = (value: any) => {
  if (typeof value !== 'string') {
    throw new Error('Invalid type');
  }

  if (value.match(/^(http|https):\/\/[^ "]+$/) === null) {
    throw new Error('Invalid URL');
  }
};
