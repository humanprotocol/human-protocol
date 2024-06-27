import { AutoMap } from '@automapper/classes';

export class JwtUserData {
  @AutoMap()
  userId: string;
  @AutoMap()
  address: string;
  @AutoMap()
  email: string;
  @AutoMap()
  kyc_status: 'APPROVED' | 'NONE';
  @AutoMap()
  reputation_network: string;
  @AutoMap()
  site_key: string;
  @AutoMap()
  iat: number;
  @AutoMap()
  exp: number;
}
