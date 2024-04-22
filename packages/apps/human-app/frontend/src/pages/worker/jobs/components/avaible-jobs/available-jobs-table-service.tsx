export interface AvailableJobs {
  jobDescription: string;
  escrowAddress: string;
  network: string;
  rewardAmount: string;
  jobType: string[];
}

const data: AvailableJobs[] = [
  {
    jobDescription: 'Job description',
    escrowAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    network: 'Polygon',
    rewardAmount: '5 HMT',
    jobType: ['Image labeling', 'Image labeling'],
  },
  {
    jobDescription: 'Job description',
    escrowAddress: 'test!',
    network: 'Polygon',
    rewardAmount: '5 HMT',
    jobType: ['Image labeling'],
  },
  {
    jobDescription: 'Job description',
    escrowAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    network: 'Polygon',
    rewardAmount: '5 HMT',
    jobType: ['Image labeling'],
  },
];

export function getJobsTableData(): Promise<AvailableJobs[]> {
  return Promise.resolve(data);
}
