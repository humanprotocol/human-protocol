import { IOperator } from '@human-protocol/sdk';

export class OracleDiscoveryResponse implements IOperator {
  address: string;
  role?: string;
  url?: string;
  jobTypes?: string[];
  constructor(address: string, role: string, url: string, jobTypes: string[]) {
    this.address = address;
    this.role = role;
    this.url = url;
    this.jobTypes = jobTypes;
  }
}
