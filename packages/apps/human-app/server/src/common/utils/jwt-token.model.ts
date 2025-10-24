import { AutoMap } from '@automapper/classes';

export class JwtUserData {
  @AutoMap()
  user_id: string;
  @AutoMap()
  wallet_address: string;
  @AutoMap()
  status: string;
  @AutoMap()
  reputation_network: string;
  @AutoMap()
  stake_eligible?: boolean;
  @AutoMap()
  email?: string;
  @AutoMap()
  qualifications?: string[];
  @AutoMap()
  site_key?: string;
}
