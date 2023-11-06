import {
  Controller,
  Get,
  Logger,
  Request,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { IUserBalance } from '../../common/interfaces';
import { JwtAuthGuard } from '../../common/guards';
import { RequestWithUser } from '../../common/types';
import { ErrorUser } from '../../common/constants/errors';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('User')
@Controller('/user')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  @Get('/balance')
  public async getBalance(
    @Request() req: RequestWithUser,
  ): Promise<IUserBalance> {
    try {
      return this.userService.getBalance(req.user.id);
    } catch (e) {
      this.logger.log(
        e.message,
        `${UserController.name} - ${ErrorUser.BalanceCouldNotBeRetreived}`,
      );
      throw new UnprocessableEntityException(
        ErrorUser.BalanceCouldNotBeRetreived,
      );
    }
  }
}
