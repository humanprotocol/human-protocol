import {
  Controller,
  Get,
  Logger,
  Request,
  UnprocessableEntityException,
  UseGuards,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { IUserBalance } from '../../common/interfaces';
import { JwtAuthGuard } from '../../common/guards';
import { RequestWithUser } from '../../common/types';
import { ErrorUser } from '../../common/constants/errors';
import { ApiKeyService } from '../auth/apikey.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('User')
@Controller('/user')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService, private readonly apikeyService: ApiKeyService) {}

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

  @Post('/api-key')
  @HttpCode(HttpStatus.CREATED)
  public async createOrUpdateAPIKey(
    @Request() req: RequestWithUser,
  ): Promise<{ apiKey: string }> {
    try {
      const apiKey = await this.apikeyService.createOrUpdateAPIKey(req.user.id);
      return { apiKey };
    } catch (e) {
      this.logger.log(
        e.message,
        `${UserController.name} - ${ErrorUser.ApiKeyCouldNotBeCreatedOrUpdated}`,
      );
      throw new UnprocessableEntityException(
        ErrorUser.ApiKeyCouldNotBeCreatedOrUpdated,
      );
    }
  }
}
