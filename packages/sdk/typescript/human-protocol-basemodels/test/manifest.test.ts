import { expect } from '@jest/globals';
import {
  BaseJobTypesEnum,
  InternalConfig,
  JobMode,
  Manifest,
  MultiChallengeManifests,
  NestedManifest,
  RequestConfig,
  RestrictedAudience,
  validate,
  validateNestedManifest,
} from '../src/manifest';
import {
  validateScoreFields,
  validateSiteKey,
} from '../src/restricted-audience';

const CALLBACK_URL = 'http://google.com/webback';
const FAKE_URL = 'http://google.com/fake';
const IMAGE_LABEL_BINARY = 'image_label_binary';

const REP_ORACLE = '0x61F9F0B31eacB420553da8BCC59DC617279731Ac';
const REC_ORACLE = '0xD979105297fB0eee83F7433fC09279cb5B94fFC6';

const getNestedManifest = ({
  request_type = IMAGE_LABEL_BINARY,
  minimum_trust = 0.1,
  request_config,
}: {
  request_type?: BaseJobTypesEnum;
  minimum_trust?: number;
  request_config?: RequestConfig;
}) => {
  const nestedManifest: NestedManifest = {
    requester_restricted_answer_set: {
      '0': { en: 'English Answer 1' },
      '1': {
        en: 'English Answer 2',
        answer_example_uri: 'https://hcaptcha.com/example_answer2.jpg',
      },
    },
    request_type: request_type,
    requester_accuracy_target: minimum_trust,
    requester_question: { en: 'How much money are we to make' },
    requester_question_example: FAKE_URL,
  };

  if (request_config) {
    nestedManifest.request_config = request_config;
  }

  return validateNestedManifest(nestedManifest);
};

const getManifest = ({
  number_of_tasks = 100,
  bid_amount = 1.0,
  oracle_stake = 0.05,
  expiration_date = 0,
  minimum_trust = 0.1,
  request_type = IMAGE_LABEL_BINARY,
  job_mode = 'batch',
  request_config,
  multi_challenge_manifests,
}: {
  number_of_tasks?: number;
  bid_amount?: number;
  oracle_stake?: number;
  expiration_date?: number;
  minimum_trust?: number;
  request_type?: BaseJobTypesEnum;
  request_config?: RequestConfig;
  job_mode?: JobMode;
  multi_challenge_manifests?: MultiChallengeManifests;
}): Manifest | null => {
  const internal_config: InternalConfig = { exchange: { a: 1, b: 'c' } };

  const manifest: Manifest = {
    requester_restricted_answer_set: {
      '0': { en: 'English Answer 1' },
      '1': {
        en: 'English Answer 2',
        answer_example_uri: 'https://hcaptcha.com/example_answer2.jpg',
      },
    },
    job_mode: job_mode,
    request_type: request_type,
    internal_config: internal_config,
    multi_challenge_manifests: multi_challenge_manifests,
    unsafe_content: false,
    task_bid_price: bid_amount,
    oracle_stake: oracle_stake,
    expiration_date: expiration_date,
    minimum_trust_server: minimum_trust,
    minimum_trust_client: minimum_trust,
    requester_accuracy_target: minimum_trust,
    recording_oracle_addr: 'recording_oracle',
    reputation_oracle_addr: REP_ORACLE,
    reputation_agent_addr: REP_ORACLE,
    instant_result_delivery_webhook: CALLBACK_URL,
    requester_question: { en: 'How much money are we to make' },
    requester_question_example: FAKE_URL,
    job_total_tasks: number_of_tasks,
    taskdata_uri: FAKE_URL,
  };
  if (request_config) {
    manifest.request_config = request_config;
  }

  return validate(manifest);
};

describe('Manifest', () => {
  it('should create a Manifest', () => {
    const manifest = getManifest({});

    expect(manifest).not.toBeNull();
  });

  it('should fail if the amount is invalid', () => {
    expect(() => {
      getManifest({ number_of_tasks: -1 });
    }).toThrow('Invalid amount');
  });

  it('should fail with invalid taskdata URI', () => {
    const manifest = getManifest({});
    expect(manifest).not.toBeNull();

    if (manifest) {
      manifest.taskdata_uri = 'test';
      expect(() => {
        validate(manifest);
      }).toThrow('Invalid URL');
    }
  });

  it('should create a Manifest using valid request config', () => {
    const manifest = getManifest({
      request_type: 'image_label_area_select',
      request_config: { shape_type: 'point', overlap_threshold: 0.8 },
    });

    expect(manifest).not.toBeNull();
  });

  it('should create a Manifest with nested request config', () => {
    const nestedManifest = getNestedManifest({
      request_type: 'image_label_area_select',
      request_config: { shape_type: 'point' },
    });

    const manifest = getManifest({
      request_type: 'multi_challenge',
      multi_challenge_manifests: [nestedManifest],
    });

    expect(manifest).not.toBeNull();
  });

  it('should create a Manifest with multiple nested request config', () => {
    const nestedManifest = getNestedManifest({
      request_type: 'image_label_area_select',
      request_config: { shape_type: 'point' },
    });

    const nestedManifest2 = getNestedManifest({
      request_type: 'image_label_area_select',
      request_config: { shape_type: 'point' },
    });

    const manifest = getManifest({
      request_type: 'multi_challenge',
      multi_challenge_manifests: [nestedManifest, nestedManifest2],
    });

    expect(manifest).not.toBeNull();
  });

  it('should create default restricted answer set', () => {
    const manifest: Manifest = {
      job_mode: 'batch',
      request_type: 'image_label_area_select',
      unsafe_content: false,
      task_bid_price: 1,
      oracle_stake: 0.1,
      expiration_date: 0,
      minimum_trust_server: 0.1,
      minimum_trust_client: 0.1,
      requester_accuracy_target: 0.1,
      recording_oracle_addr: REC_ORACLE,
      reputation_oracle_addr: REP_ORACLE,
      reputation_agent_addr: REP_ORACLE,
      instant_result_delivery_webhook: CALLBACK_URL,
      requester_question: { en: 'How much money are we to make' },
      requester_question_example: FAKE_URL,
      job_total_tasks: 5,
      taskdata_uri: FAKE_URL,
    };

    const validatedManifest = validate(manifest);

    expect(
      Object.keys(validatedManifest.requester_restricted_answer_set || {})
        .length
    ).toBeGreaterThan(0);
  });

  it('should validate requester question example', () => {
    const manifest = getManifest({});

    if (manifest) {
      manifest.requester_question_example = 'https://test.com';
      const validatedManifest = validate(manifest);
      expect(validatedManifest.requester_question_example).toBe(
        'https://test.com'
      );
    }

    if (manifest) {
      manifest.requester_question_example = ['https://test.com'];
      const validatedManifest = validate(manifest);
      expect(validatedManifest.requester_question_example?.length).toBe(1);
    }

    if (manifest) {
      manifest.requester_question_example = 'non-url';
      expect(() => validate(manifest)).toThrow('Invalid URL');
    }

    if (manifest) {
      manifest.requester_question_example = ['non-url'];
      expect(() => validate(manifest)).toThrow('Invalid URL');
    }
  });

  it('should parse restricted audience', () => {
    const manifest = getManifest({});

    if (!manifest) {
      return;
    }

    const restrictedAudience: RestrictedAudience = {
      lang: [{ 'en-us': { score: 0.9 } }],
      confidence: [{ minimum_client_confidence: { score: 0.9 } }],
      min_difficulty: 2,
    };

    manifest.restricted_audience = restrictedAudience;

    const validatedManifest = validate(manifest);

    expect(validatedManifest.restricted_audience).toEqual(restrictedAudience);
  });

  it('should validate restricted audience', () => {
    // Lang
    expect(() => validateScoreFields({ lang: [{ US: { score: 1 } }] })).toThrow(
      'lang key must use lowercase keys'
    );
    expect(() =>
      validateScoreFields({ lang: [{ us: { score: -0.1 } }] })
    ).toThrow('Score must be between 0 and 1');

    // Browser
    expect(() =>
      validateScoreFields({ browser: [{ desktop: { score: -0.1 } }] })
    ).toThrow('Score must be between 0 and 1');

    // Sitekey
    expect(() =>
      validateSiteKey({
        sitekey: [{ '9d98b147': { score: 1 } }],
      })
    ).toThrow('Invalid UUID');

    expect(() =>
      validateScoreFields({
        sitekey: [{ '9D98B147-DC5a-4ea4-82cf-0ced5b2434d2': { score: 1 } }],
      })
    ).toThrow('sitekey key must use lowercase keys');

    expect(() =>
      validateScoreFields({
        sitekey: [{ '9d98b147-dc5a-4ea4-82cf-0ced5b2434d2': { score: -0.1 } }],
      })
    ).toThrow('Score must be between 0 and 1');
  });

  it('Should create manifest with real life data', () => {
    const manifest: Manifest = {
      job_mode: 'batch',
      unsafe_content: false,
      task_bid_price: 1,
      oracle_stake: 0.1,
      expiration_date: 0,
      minimum_trust_server: 0.1,
      minimum_trust_client: 0.1,
      requester_accuracy_target: 0.1,
      job_total_tasks: 1000,
      recording_oracle_addr: REC_ORACLE,
      reputation_oracle_addr: REP_ORACLE,
      reputation_agent_addr: REP_ORACLE,
      job_id: 'c26c2e6a-41ab-4218-b39e-6314b760c45c',
      request_type: 'multi_challenge',
      requester_question: {
        en: 'Please draw a bow around the text shown, select the best corresponding labels, and enter the word depicted by the image.',
      },
      multi_challenge_manifests: [
        {
          request_type: 'image_label_area_select',
          job_id: 'c26c2e6a-41ab-4218-b39e-6314b760c45c',
          requester_question: {
            en: 'Please draw a bow around the text shown.',
          },
          request_config: {
            shape_type: 'polygon',
            min_points: 1,
            max_points: 4,
            min_shapes_per_image: 1,
            max_shapes_per_image: 4,
          },
        },
        {
          request_type: 'image_label_multiple_choice',
          job_id: 'c26c2e6a-41ab-4218-b39e-6314b760c45c',
          requester_question: { en: 'Select the corresponding label.' },
          requester_restricted_answer_set: {
            print: { en: 'Print' },
            'hand-writing': { en: 'Hand Writing' },
          },
          request_config: { multiple_choice_max_choices: 1 },
        },
        {
          request_type: 'image_label_multiple_choice',
          job_id: 'c26c2e6a-41ab-4218-b39e-6314b760c45c',
          requester_question: { en: 'Select the corresponding labels.' },
          requester_restricted_answer_set: {
            'top-bottom': { en: 'Top to Bottom' },
            'bottom-top': { en: 'Bottom to Top' },
            'left-right': { en: 'Left to Right' },
            'right-left': { en: 'Right to Left' },
          },
          request_config: { multiple_choice_max_choices: 1 },
        },
        {
          request_type: 'image_label_text',
          job_id: 'c26c2e6a-41ab-4218-b39e-6314b760c45c',
          requester_question: { en: 'Please enter the word in the image.' },
        },
      ],
      taskdata: [
        {
          datapoint_hash: 'sha1:5daf66c6031df7f8913bfa0b52e53e3bcd42aab3',
          datapoint_uri: 'http://test.com/task.jpg',
          task_key: '2279daef-d10a-4b0f-85d1-0ccbf7c8906b',
        },
      ],
    };

    const validatedManifest = validate(manifest);
    expect(validatedManifest).not.toBeNull();
  });
});
