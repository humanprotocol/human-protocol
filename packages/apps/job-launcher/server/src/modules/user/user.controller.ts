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
import { JwtAuthGuard } from 'src/common/guards';
import { RequestWithUser } from 'src/common/types';
import { ErrorUser } from 'src/common/constants/errors';
import { Currency } from 'src/common/enums/payment';

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
    return {
      amount: req.user.balance,
      currency: Currency.USD,
    };
  }
}
