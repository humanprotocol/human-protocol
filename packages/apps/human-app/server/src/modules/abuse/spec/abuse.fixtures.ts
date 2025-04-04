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
export const TOKEN = 'test_user_token';

export const reportAbuseDtoFixture: ReportAbuseDto = {
  chain_id: CHAIN_ID,
  escrow_address: ESCROW_ADDRESS,
};

export const reportAbuseParamsFixture: ReportAbuseParams = {
  chainId: CHAIN_ID,
  escrowAddress: ESCROW_ADDRESS,
};

export const reportAbuseCommandFixture: ReportAbuseCommand = {
  data: reportAbuseParamsFixture,
  token: TOKEN,
};

export const reportedAbuseItemFixture: ReportedAbuseItem = {
  id: ABUSE_ID,
  escrowAddress: ESCROW_ADDRESS,
  chainId: CHAIN_ID,
  status: STATUS,
};

export const reportedAbuseResponseFixture: ReportedAbuseResponse = {
  results: [reportedAbuseItemFixture],
};
