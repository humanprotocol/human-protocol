export interface RequestWithUser extends Request {
  user: JwtUser;
}

export interface JwtUser {
  email: string;
  address: string;
  kycStatus: string;
  reputationNetwork: string;
}
