/* eslint-disable camelcase -- output from api */
export interface AvailableJobs {
  page: number;
  page_size: number;
  total_pages: number;
  total_results: number;
  results: JobsArray[];
}

export interface JobsArray {
  escrow_address: string;
  chain_id: number;
  job_type: string;
  status: string;
}

const data: AvailableJobs = {
  page: 0,
  page_size: 5,
  total_pages: 2,
  total_results: 7,
  results: [
    {
      escrow_address: '0x2db00C8A1793424e35f6Cc634Eb13CC174929A4A',
      chain_id: 80002,
      job_type: 'FORTUNE',
      status: 'ACTIVE',
    },
    {
      escrow_address: '0x7Cf6978f8699Cf22a121B6332BDF3c5C2F10e3e3',
      chain_id: 80002,
      job_type: 'FORTUNE',
      status: 'ACTIVE',
    },
    {
      escrow_address: '0xb389ac3678bF3723863dF92B5D531b0d12e82431',
      chain_id: 80002,
      job_type: 'FORTUNE',
      status: 'ACTIVE',
    },
    {
      escrow_address: '0xe9B9b198b093A078Fe8900b703637C26FD2f06a4',
      chain_id: 80002,
      job_type: 'FORTUNE',
      status: 'ACTIVE',
    },
    {
      escrow_address: '0x531e2CDB13f2c5606F8C251799f93CBb1219C14C',
      chain_id: 80002,
      job_type: 'FORTUNE',
      status: 'ACTIVE',
    },
  ],
};

export function getJobsTableData(): Promise<AvailableJobs> {
  return Promise.resolve(data);
}
