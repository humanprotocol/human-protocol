import {
  BaseJobTypesEnum,
  InternalConfig,
  JobMode,
  Manifest,
  MultiChallengeManifests,
  validate,
} from '../src/manifest';

const CALLBACK_URL = 'http://google.com/webback';
const FAKE_URL = 'http://google.com/fake';
const IMAGE_LABEL_BINARY = 'image_label_binary';

const REP_ORACLE = '0x61F9F0B31eacB420553da8BCC59DC617279731Ac';
const REC_ORACLE = '0xD979105297fB0eee83F7433fC09279cb5B94fFC6';
const FAKE_ORACLE = '0x1413862c2b7054cdbfdc181b83962cb0fc11fd92';

const getManifest = (
  number_of_tasks = 100,
  bid_amount = 1.0,
  oracle_stake = 0.05,
  expiration_date = 0,
  minimum_trust = 0.1,
  request_type: BaseJobTypesEnum = IMAGE_LABEL_BINARY,
  request_config = null,
  job_mode: JobMode = 'batch',
  multi_challenge_manifests?: MultiChallengeManifests
): Manifest | null => {
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
    const manifest = getManifest();

    expect(manifest).not.toBeNull();
  });

  it('should fail if the amount is invalid', () => {
    expect(() => {
      getManifest(-1);
    }).toThrow('Invalid amount');
  });

  it('should fail with invalid taskdata URI', () => {
    const manifest = getManifest();
    expect(manifest).not.toBeNull();

    if (manifest) {
      manifest.taskdata_uri = 'test';
      expect(() => {
        validate(manifest);
      }).toThrow('Invalid URL');
    }
  });
});
