import {
  ReportAbuseDto,
  ReportAbuseParams,
  ReportAbuseCommand,
  ReportedAbuseResponse,
  ReportedAbuseItem,
} from '../model/abuse.model';

const ESCROW_ADDRESS = 'test_address';
const CHAIN_ID = 1;
const STATUS = 'reported';
const ABUSE_ID = 1;
const REASON = 'Test abuse reason';
export const TOKEN = 'test_user_token';

export const reportAbuseDtoFixture: ReportAbuseDto = {
  chain_id: CHAIN_ID,
  escrow_address: ESCROW_ADDRESS,
  reason: REASON,
};

export const reportAbuseParamsFixture: ReportAbuseParams = {
  chainId: CHAIN_ID,
  escrowAddress: ESCROW_ADDRESS,
  reason: REASON,
};

export const reportAbuseCommandFixture: ReportAbuseCommand = {
  data: reportAbuseParamsFixture,
  token: TOKEN,
  reason: REASON,
};

export const reportedAbuseItemFixture: ReportedAbuseItem = {
  id: ABUSE_ID,
  escrowAddress: ESCROW_ADDRESS,
  chainId: CHAIN_ID,
  status: STATUS,
  reason: REASON,
};

export const reportedAbuseResponseFixture: ReportedAbuseResponse = {
  results: [reportedAbuseItemFixture],
};
