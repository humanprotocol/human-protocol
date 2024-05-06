/* eslint-disable camelcase -- output from api */
export interface MyJobs {
  page: number;
  page_size: number;
  total_pages: number;
  total_results: number;
  results: JobsArray[];
}

interface JobsArray {
  assignment_id: number;
  escrow_address: string;
  chain_id: number;
  job_type: string;
  status: string;
  reward_amount: number;
  reward_token: string;
  created_at: string;
  expires_at: string;
  url: string;
}

const data: MyJobs = {
  page: 0,
  page_size: 5,
  total_pages: 1,
  total_results: 2,
  results: [
    {
      assignment_id: 8,
      escrow_address: '0x2db00C8A1793424e35f6Cc634Eb13CC174929A4A',
      chain_id: 80002,
      job_type: 'FORTUNE',
      status: 'ACTIVE',
      reward_amount: 14.004735281093245,
      reward_token: 'HMT',
      created_at: '2024-04-22T14:38:03.956Z',
      expires_at: '2024-07-25T06:05:16.000Z',
      url: 'http://stg-fortune-exchange-oracle-server.humanprotocol.org',
    },
    {
      assignment_id: 9,
      escrow_address: '0xb389ac3678bF3723863dF92B5D531b0d12e82431',
      chain_id: 80002,
      job_type: 'FORTUNE',
      status: 'ACTIVE',
      reward_amount: 14.550093644402695,
      reward_token: 'HMT',
      created_at: '2024-04-23T08:24:14.274Z',
      expires_at: '2024-07-27T14:25:15.000Z',
      url: 'http://stg-fortune-exchange-oracle-server.humanprotocol.org',
    },
  ],
};

export function getJobsTableData(): Promise<MyJobs> {
  return Promise.resolve(data);
}
