import { v4 as uuidv4 } from 'uuid';
import { Manifest } from './generated/manifest';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validateInteger = (value: any) => {
  if (typeof value !== 'number') {
    throw new Error('Invalid type');
  }

  if (value < 0) {
    throw new Error('Invalid amount');
  }
};

export const validateUUID = (
  manifest: Manifest,
  field: keyof Manifest
): Manifest => {
  if (!manifest[field]) {
    manifest[field] = uuidv4();
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
