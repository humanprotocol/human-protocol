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
  Get,
} from '@nestjs/common';
import {
  DisableOperatorDto,
  PrepareSignatureDto,
  RegisterAddressRequestDto,
  SignatureBodyDto,
  RegisterLabelerResponseDto,
  EnableOperatorDto,
  RegisterOracleDto,
  RegisteredOraclesDto,
} from './user.dto';
import { JwtAuthGuard } from '../../common/guards';
import { RequestWithUser } from '../../common/types';
import { UserService } from './user.service';
import { Public } from '../../common/decorators';
import { KycSignedAddressDto } from '../kyc/kyc.dto';

@ApiTags('User')
@Controller('/user')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/register-labeler')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Register Labeler',
    description: 'Endpoint to register user as a labeler on hcaptcha services.',
  })
  @ApiResponse({
    status: 200,
    description: 'Labeler registered successfully',
    type: RegisterLabelerResponseDto,
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
  public async registerLabeler(
    @Req() request: RequestWithUser,
  ): Promise<RegisterLabelerResponseDto> {
    const siteKey = await this.userService.registerLabeler(request.user);

    return { siteKey };
  }

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
    type: KycSignedAddressDto,
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
  ): Promise<KycSignedAddressDto> {
    return this.userService.registerAddress(request.user, data);
  }

  @Post('/enable-operator')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Enable an operator',
    description: 'Endpoint to enable an operator.',
  })
  @ApiBody({ type: EnableOperatorDto })
  @ApiResponse({
    status: 204,
    description: 'Operator enabled succesfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Could not find the requested content.',
  })
  public enableOperator(
    @Body() data: EnableOperatorDto,
    @Request() req: RequestWithUser,
  ): Promise<void> {
    return this.userService.enableOperator(req.user, data.signature);
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

  @Public()
  @Post('/prepare-signature')
  @ApiOperation({
    summary: 'Web3 signature body',
    description:
      'Endpoint for generating typed structured data objects compliant with EIP-712. The generated object should be convertible to a string format to ensure compatibility with signature mechanisms.',
  })
  @ApiBody({ type: PrepareSignatureDto })
  @ApiResponse({
    status: 200,
    description: 'Typed structured data object generated successfully',
    type: SignatureBodyDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  public async prepareSignature(
    @Body() data: PrepareSignatureDto,
  ): Promise<SignatureBodyDto> {
    return await this.userService.prepareSignatureBody(data.type, data.address);
  }

  @Post('/registration')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Register Oracle',
    description: 'Endpoint to save a registration process completed.',
  })
  @ApiBody({ type: RegisterOracleDto })
  @ApiResponse({
    status: 200,
    description: 'Oracle registered successfully',
    type: RegisterOracleDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Invalid input parameters.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  public async registerOracle(
    @Req() request: RequestWithUser,
    @Body() data: RegisterOracleDto,
  ): Promise<RegisterOracleDto> {
    await this.userService.registerOracle(request.user, data.oracleAddress);
    return data;
  }

  @Get('/registration')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Get Registered Oracles',
    description:
      'Fetch the list of exchange oracles where the user completed a registration process.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of registered oracles retrieved successfully',
    type: RegisteredOraclesDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  public async getRegisteredOracles(
    @Req() request: RequestWithUser,
  ): Promise<RegisteredOraclesDto> {
    const oracleAddresses = await this.userService.getRegisteredOracles(
      request.user,
    );
    return { oracleAddresses };
  }
}
