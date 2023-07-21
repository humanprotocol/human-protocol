import { UserEntity } from 'src/modules/user/user.entity';

export type RequestWithUser = Request & { user: UserEntity };
