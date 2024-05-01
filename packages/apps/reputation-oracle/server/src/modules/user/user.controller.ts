import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  DisableOperatorDto,
  RegisterAddressRequestDto,
  RegisterAddressResponseDto,
} from './user.dto';
import { JwtAuthGuard } from '../../common/guards';
import { RequestWithUser } from '../../common/types';
import { UserService } from './user.service';

@ApiTags('User')
@Controller('/user')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Post('/register-address')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Register Blockchain Address',
    description: 'Endpoint to register blockchain address.',
  })
  @ApiBody({ type: RegisterAddressRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Blockchain address registered successfully',
    type: RegisterAddressResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Invalid input parameters.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Could not find the requested content.',
  })
  public async registerAddress(
    @Req() request: RequestWithUser,
    @Body() data: RegisterAddressRequestDto,
  ): Promise<RegisterAddressResponseDto> {
    const signedAddress = await this.userService.registerAddress(
      request.user,
      data,
    );

    return { signedAddress };
  }

  @Post('/disable-operator')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Disable an operator',
    description: 'Endpoint to disable an operator.',
  })
  @ApiBody({ type: DisableOperatorDto })
  @ApiResponse({
    status: 204,
    description: 'Operator disabled succesfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Could not find the requested content.',
  })
  public disableOperator(
    @Body() data: DisableOperatorDto,
    @Request() req: RequestWithUser,
  ): Promise<void> {
    return this.userService.disableOperator(req.user, data.signature);
  }
}
