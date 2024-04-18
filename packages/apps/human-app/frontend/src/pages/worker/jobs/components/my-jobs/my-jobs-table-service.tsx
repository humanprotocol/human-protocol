export interface MyJobs {
  escrowAddress: string;
  network: string;
  rewardAmount: string;
  jobType: string[];
  expiresAt: string;
  status: 'Active' | 'Overdue' | 'Deactivated' | 'Complited';
  isActivated: boolean;
}

const data: MyJobs[] = [
  {
    escrowAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    network: 'Polygon',
    rewardAmount: '5 HMT',
    jobType: ['Image labeling', 'Image labeling'],
    expiresAt: '2024-05-08T00:00:00Z',
    status: 'Active',
    isActivated: true,
  },
  {
    escrowAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    network: 'Polygon',
    rewardAmount: '5 HMT',
    jobType: ['Image labeling', 'Image labeling'],
    expiresAt: '2024-05-08T00:00:00Z',
    status: 'Active',
    isActivated: false,
  },
  {
    escrowAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    network: 'Polygon',
    rewardAmount: '5 HMT',
    jobType: ['Image labeling', 'Image labeling'],
    expiresAt: '2024-05-08T00:00:00Z',
    status: 'Overdue',
    isActivated: false,
  },
  {
    escrowAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    network: 'Polygon',
    rewardAmount: '5 HMT',
    jobType: ['Image labeling', 'Image labeling'],
    expiresAt: '2024-05-08T00:00:00Z',
    status: 'Complited',
    isActivated: false,
  },
  {
    escrowAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    network: 'Polygon',
    rewardAmount: '5 HMT',
    jobType: ['Image labeling', 'Image labeling'],
    expiresAt: '2024-05-08T00:00:00Z',
    status: 'Deactivated',
    isActivated: false,
  },
];

export function getJobsTableData(): Promise<MyJobs[]> {
  return Promise.resolve(data);
}
