import { JwtUserData } from '../utils/jwt-token.model';

export interface RequestWithUser extends Request {
  user: JwtUserData;
  token: string;
}
