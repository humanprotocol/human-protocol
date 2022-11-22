export enum EscrowStatus {
  Launched,
  Pending,
  Partial,
  Paid,
  Complete,
  Cancelled,
}

export type Payout = {
  address: string;
  amount: number;
};

export type Result = Record<string, string | number>;

export type UploadResult = {
  key: string;
  hash: string;
};

// TODO: Confirm Manifest data type

export type Manifest = {
  task_bid_price: number;
  job_total_tasks: number;

  oracle_stake: number;
  reputation_oracle_addr: string;
  recording_oracle_addr: string;
};
