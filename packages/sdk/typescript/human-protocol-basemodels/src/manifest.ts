import axios from 'axios';

import { JOB_TYPES_FOR_CONTENT_TYPE_VALIDATION } from './constants';
import {
  BaseJobTypesEnum,
  Manifest,
  NestedManifest,
} from './generated/manifest';
import { validateGroundTruthEntry } from './groundtruth';
import { validateScoreFields, validateSiteKey } from './restricted-audience';
import { validateNumber, validateURL, validateUUID } from './validators';

/**
 * min repeats are required to be at least 4 if ilmc
 */
const validateMinRepeats = (manifest: Manifest): Manifest => {
  if (manifest.request_type === 'image_label_multiple_choice') {
    manifest.requester_min_repeats = Math.max(
      manifest.requester_min_repeats || 0,
      4
    );
  }
  return manifest;
};

const validateGroundTruth = <T extends Manifest | NestedManifest>(
  manifest: T
) => {
  if (manifest.groundtruth && manifest.groundtruth_uri) {
    throw new Error('Specify only groundtruth_uri or groundtruth, not both.');
  }
};

/**
 * image_label_area_select should always have a single RAS set
 */
const validateRequesterRestrictedAnswerSet = <
  T extends Manifest | NestedManifest
>(
  manifest: T
): T => {
  // validation runs before other params, so need to handle missing case
  if (!manifest.request_type) {
    throw new Error('request_type missing');
  }

  if (manifest.request_type === 'image_label_area_select') {
    if (
      !manifest.requester_restricted_answer_set ||
      !Object.keys(manifest.requester_restricted_answer_set).length
    ) {
      manifest.requester_restricted_answer_set = {
        label: {},
      };
    }
  }
  return manifest;
};

const validateRequesterQuestionExample = <T extends Manifest | NestedManifest>(
  manifest: T
) => {
  // validation runs before other params, so need to handle missing case
  if (!manifest.request_type) {
    throw new Error('request_type missing');
  }

  // based on https://github.com/hCaptcha/hmt-basemodels/issues/27#issuecomment-590706643
  const supportedTypes: BaseJobTypesEnum[] = [
    'image_label_area_select',
    'image_label_binary',
  ];

  if (
    Array.isArray(manifest.requester_question_example) &&
    manifest.requester_question_example?.length &&
    supportedTypes.indexOf(manifest.request_type) === -1
  ) {
    throw new Error('Lists are not allowed in this challenge type');
  }
};

const validateTaskData = (manifest: Manifest) => {
  if (manifest.taskdata?.length && manifest.taskdata_uri) {
    throw new Error('Specify only taskdata_uri or taskdata, not both.');
  }
};

/**
 * validate request types for all types of challenges
 * multi_challenge should always have multi_challenge_manifests
 */
const validateRequestType = <T extends Manifest | NestedManifest>(
  manifest: T,
  multiChallenge = true
) => {
  if (manifest.request_type === 'multi_challenge') {
    if (!multiChallenge) {
      throw new Error('multi_challenge request is not allowed here.');
    }
    if (!manifest.multi_challenge_manifests) {
      throw new Error('multi_challenge_manifests is required.');
    }
  } else if (
    manifest.request_type === 'image_label_multiple_choice' ||
    manifest.request_type === 'image_label_area_select'
  ) {
    if (
      (manifest.request_config?.multiple_choice_min_choices || 1) >
      (manifest.request_config?.multiple_choice_max_choices || 1)
    ) {
      throw new Error(
        'multiple_choice_min_choices cannot be greater than multiple_choice_max_choices'
      );
    }
  }
};

export const validate = (manifest: Manifest): Manifest => {
  // Basic validation
  validateNumber(manifest.job_total_tasks);
  validateNumber(manifest.task_bid_price);

  if (manifest.taskdata_uri) {
    validateURL(manifest.taskdata_uri);
  }
  if (manifest.groundtruth_uri) {
    validateURL(manifest.groundtruth_uri);
  }
  if (manifest.rejected_uri) {
    validateURL(manifest.rejected_uri);
  }
  if (manifest.requester_question_example) {
    if (Array.isArray(manifest.requester_question_example)) {
      manifest.requester_question_example.forEach(validateURL);
    } else {
      validateURL(manifest.requester_question_example);
    }
  }

  let manifestValidated = manifest;
  manifestValidated = validateMinRepeats(manifestValidated);
  manifestValidated = validateUUID(manifestValidated, 'job_id');
  manifestValidated = validateUUID(manifestValidated, 'job_api_key');
  manifestValidated = validateRequesterRestrictedAnswerSet(manifestValidated);

  validateGroundTruth(manifestValidated);
  validateRequesterQuestionExample(manifestValidated);
  validateTaskData(manifestValidated);
  validateRequestType(manifestValidated);

  if (manifestValidated.restricted_audience) {
    validateScoreFields(manifestValidated.restricted_audience);
    validateSiteKey(manifestValidated.restricted_audience);
  }

  return manifestValidated;
};

export const validateNestedManifest = (
  nestedManifest: NestedManifest
): NestedManifest => {
  if (nestedManifest.groundtruth_uri) {
    validateURL(nestedManifest.groundtruth_uri);
  }

  let nestedManifestValidated = nestedManifest;

  nestedManifestValidated = validateUUID(nestedManifestValidated, 'job_id');
  nestedManifestValidated = validateRequesterRestrictedAnswerSet(
    nestedManifestValidated
  );

  validateRequesterQuestionExample(nestedManifestValidated);
  validateRequestType(nestedManifestValidated, false);
  validateGroundTruth(nestedManifestValidated);

  return nestedManifestValidated;
};

/**
 * Validate taskdata_uri
 * Returns entries count if succeeded
 */
const validateTaskDataURI = async (manifest: Manifest) => {
  const requestType = manifest.request_type;

  const validateImageContentType =
    JOB_TYPES_FOR_CONTENT_TYPE_VALIDATION.indexOf(requestType) > -1;
  const uriKey = 'taskdata_uri';

  const uri = manifest[uriKey];

  if (!uri) {
    return;
  }

  try {
    const data = await axios.get(uri).then((res) => res.data);
    if (Array.isArray(data)) {
      for (const item of data) {
        await validateGroundTruthEntry(
          '',
          item,
          requestType,
          validateImageContentType
        );
      }
    }
  } catch (e) {
    throw new Error(`${uriKey} validation failed: ${e.message}`);
  }
};

export const validateManifestURIs = async (manifest: Manifest) => {
  await validateTaskDataURI(manifest);
};

export * from './generated/manifest';
