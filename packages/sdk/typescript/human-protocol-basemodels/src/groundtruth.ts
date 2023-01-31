import axios from 'axios';

import { SUPPORTED_CONTENT_TYPES } from './constants';
import { BaseJobTypesEnum } from './generated/manifest';
import { validateURL } from './validators';

const validateContentType = async (uri: string) => {
  try {
    const response = await axios.head(uri);
    if (
      SUPPORTED_CONTENT_TYPES.indexOf(response.headers['content-type']) === -1
    ) {
      throw new Error('Invalid content type');
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e) {
    throw new Error(e.message);
  }
};

type ILBGroundtruthEntryModel = Array<'true' | 'false'>;
type ILMCGroundtruthEntryModel = Array<Array<string>>;
type ILASGroundtruthEntry = {
  entity_name: number;
  entity_type: string;
  entity_coords: Array<number>;
};
type ILASGroundtruthEntryModel = Array<Array<ILASGroundtruthEntry>>;

/**
 * Validate key & value of groundtruth entry based on request_type
 *
 * @param {string} key
 * @param { Record<string, string> | string[]} value
 * @param {BaseJobTypesEnum} requestType
 * @param {boolean} validateImageContentType
 */
export const validateGroundTruthEntry = async (
  key: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
  requestType: BaseJobTypesEnum,
  validateImageContentType: boolean
) => {
  validateURL(key);

  if (requestType === 'image_label_binary') {
    if ((value as ILBGroundtruthEntryModel) !== value) {
      throw new Error('Invalid groundtruth entry');
    }
  } else if (requestType === 'image_label_multiple_choice') {
    if ((value as ILMCGroundtruthEntryModel) !== value) {
      throw new Error('Invalid groundtruth entry');
    }
  } else if (requestType === 'image_label_area_select') {
    if ((value as ILASGroundtruthEntryModel) !== value) {
      throw new Error('Invalid groundtruth entry');
    }
  } else {
    return;
  }
  if (validateImageContentType) {
    await validateContentType(key);
  }
};
