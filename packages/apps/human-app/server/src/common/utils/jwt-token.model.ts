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
}
