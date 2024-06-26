import { Role } from '../enums/role';

export interface RequestWithUser extends Request {
  user: JwtUser;
}

export interface JwtUser {
  role: Role;
  email: string;
  address: string;
  kycStatus: string;
  reputationNetwork: string;
}
