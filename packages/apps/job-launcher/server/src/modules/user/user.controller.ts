import {
  Controller,
  Get,
  Logger,
  Request,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards';
import { RequestWithUser } from '../../common/types';
import { ErrorUser } from '../../common/constants/errors';
import { UserBalanceDto } from './user.dto';
import { ApiKey } from '../../common/decorators';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('User')
@Controller('/user')
@ApiKey()
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: 'Get user balance',
    description: 'Endpoint to retrieve the balance of the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User balance retrieved successfully',
    type: UserBalanceDto,
  })
  @ApiResponse({
    status: 422,
    description: 'Unprocessable Entity. User balance could not be retrieved.',
  })
  @Get('/balance')
  public async getBalance(
    @Request() req: RequestWithUser,
  ): Promise<UserBalanceDto> {
    try {
      return this.userService.getBalance(req.user.id);
    } catch (e) {
      this.logger.log(
        e.message,
        `${UserController.name} - ${ErrorUser.BalanceCouldNotBeRetrieved}`,
      );
      throw new UnprocessableEntityException(
        ErrorUser.BalanceCouldNotBeRetrieved,
      );
    }
  }
}
