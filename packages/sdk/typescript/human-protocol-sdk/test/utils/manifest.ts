import { Manifest } from '../../src';

const CALLBACK_URL = 'http://google.com/webback';
const GAS_PAYER = '0x1413862c2b7054cdbfdc181b83962cb0fc11fd92';
const FAKE_URL = 'http://google.com/fake';
const IMAGE_LABEL_BINARY = 'image_label_binary';

export const manifest: Manifest = {
  requester_restricted_answer_set: {
    '0': { en: 'English Answer 1' },
    '1': {
      en: 'English Answer 2',
      answer_example_uri: 'https://hcaptcha.com/example_answer2.jpg',
    },
  },
  job_mode: 'batch',
  request_type: IMAGE_LABEL_BINARY,
  unsafe_content: false,
  task_bid_price: 1,
  oracle_stake: 0.05,
  expiration_date: 0,
  minimum_trust_server: 0.1,
  minimum_trust_client: 0.1,
  requester_accuracy_target: 0.1,
  recording_oracle_addr: GAS_PAYER,
  reputation_oracle_addr: GAS_PAYER,
  reputation_agent_addr: GAS_PAYER,
  instant_result_delivery_webhook: CALLBACK_URL,
  requester_question: { en: 'How much money are we to make' },
  requester_question_example: FAKE_URL,
  job_total_tasks: 100,
  taskdata_uri: FAKE_URL,
};
