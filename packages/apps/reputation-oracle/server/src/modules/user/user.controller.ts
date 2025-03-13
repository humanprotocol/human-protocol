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
  UseFilters,
} from '@nestjs/common';
import { Public } from '../../common/decorators';
import { SignatureType } from '../../common/enums/web3';
import { RequestWithUser } from '../../common/interfaces/request';
import { Web3ConfigService } from '../../config/web3-config.service';
import { HCaptchaGuard } from '../../integrations/hcaptcha/hcaptcha.guard';
import logger from '../../logger';
import { prepareSignatureBody } from '../../utils/web3';
import {
  DisableOperatorDto,
  PrepareSignatureDto,
  RegisterAddressRequestDto,
  SignatureBodyDto,
  RegisterLabelerResponseDto,
  EnableOperatorDto,
  RegistrationInExchangeOracleDto,
  RegistrationInExchangeOraclesResponseDto,
  RegistrationInExchangeOracleResponseDto,
} from './user.dto';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { UserErrorFilter } from './user.error.filter';

/**
 * TODO:
 * 1) Refactor this module to have separate 'workers` and `operators` sub-resources
 *  - use `/:userId` for worker sub-resources;
 *  - use `/:evmAddress` for operator sub-resources
 *  - move all "controller" resources to be accessible by user ref, e.g. /workers/:userId/register-labeler
 * 2) Move "prepare-signature" out of this module
 */
@ApiTags('User')
@ApiBearerAuth()
@Controller('/user')
@UseFilters(UserErrorFilter)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly web3ConfigService: Web3ConfigService,
    private readonly userRepository: UserRepository,
  ) {}

  @ApiOperation({
    summary: 'Register labeler',
    description: 'Endpoint to register user as a labeler on hCaptcha services',
  })
  @ApiResponse({
    status: 200,
    description: 'Labeler registered successfully',
    type: RegisterLabelerResponseDto,
  })
  @Post('/register-labeler')
  @HttpCode(200)
  async registerLabeler(
    @Req() request: RequestWithUser,
  ): Promise<RegisterLabelerResponseDto> {
    const siteKey = await this.userService.registerLabeler(request.user);

    return { siteKey };
  }

  @ApiOperation({
    summary: 'Register worker address',
    description: 'Endpoint to register blockchain address for worker',
  })
  @ApiBody({ type: RegisterAddressRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Blockchain address registered successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Provided address already registered',
  })
  @Post('/register-address')
  @HttpCode(200)
  async registerAddress(
    @Req() request: RequestWithUser,
    @Body() data: RegisterAddressRequestDto,
  ): Promise<void> {
    await this.userService.registerAddress(request.user, data);
  }

  @ApiOperation({
    summary: 'Enable an operator',
    description: 'Endpoint to enable an operator',
  })
  @ApiBody({ type: EnableOperatorDto })
  @ApiResponse({
    status: 200,
    description: 'Operator enabled succesfully',
  })
  @Post('/enable-operator')
  @HttpCode(200)
  async enableOperator(
    @Body() data: EnableOperatorDto,
    @Request() req: RequestWithUser,
  ): Promise<void> {
    await this.userService.enableOperator(req.user, data.signature);
  }

  @ApiOperation({
    summary: 'Disable operator',
    description: 'Endpoint to disable operator',
  })
  @ApiBody({ type: DisableOperatorDto })
  @ApiResponse({
    status: 200,
    description: 'Operator disabled succesfully',
  })
  @Post('/disable-operator')
  @HttpCode(200)
  async disableOperator(
    @Body() data: DisableOperatorDto,
    @Request() req: RequestWithUser,
  ): Promise<void> {
    await this.userService.disableOperator(req.user, data.signature);
  }

  @ApiOperation({
    summary: 'Web3 signature body',
    description:
      'Endpoint for generating typed structured data objects compliant with EIP-712. The generated object should be convertible to a string format to ensure compatibility with signature mechanisms',
  })
  @ApiBody({ type: PrepareSignatureDto })
  @ApiResponse({
    status: 200,
    description: 'Typed structured data object generated successfully',
    type: SignatureBodyDto,
  })
  @Public()
  @Post('/prepare-signature')
  @HttpCode(200)
  async prepareSignature(
    @Body() data: PrepareSignatureDto,
  ): Promise<SignatureBodyDto> {
    let nonce: string | undefined;
    if (data.type === SignatureType.SIGNIN) {
      const user = await this.userService.findOperatorUser(data.address);
      nonce = user?.nonce;
    }

    const preparedSignatureBody = await prepareSignatureBody({
      from: data.address,
      to: this.web3ConfigService.operatorAddress,
      contents: data.type,
      nonce,
    });

    return preparedSignatureBody;
  }

  @ApiOperation({
    summary: 'Notifies registration in Exchange Oracle completed',
    description:
      'Notifies that the registration process in a Exchange Oracle has been completed by the user',
  })
  @ApiBody({ type: RegistrationInExchangeOracleDto })
  @ApiResponse({
    status: 200,
    description: 'Oracle registered successfully',
    type: RegistrationInExchangeOracleDto,
  })
  @UseGuards(HCaptchaGuard)
  @Post('/exchange-oracle-registration')
  @HttpCode(200)
  async registrationInExchangeOracle(
    @Req() request: RequestWithUser,
    @Body() data: RegistrationInExchangeOracleDto,
  ): Promise<RegistrationInExchangeOracleResponseDto> {
    await this.userService.registrationInExchangeOracle(
      request.user,
      data.oracleAddress,
    );

    return { oracleAddress: data.oracleAddress };
  }

  @ApiOperation({
    summary: 'Retrieves Exchange Oracles the user is registered in',
    description:
      'Fetches the list of Exchange Oracles where the user has completed the registration process.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of registered oracles retrieved successfully',
    type: RegistrationInExchangeOraclesResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  @Get('/exchange-oracle-registration')
  async getRegistrationInExchangeOracles(
    @Req() request: RequestWithUser,
  ): Promise<RegistrationInExchangeOraclesResponseDto> {
    const oracleAddresses =
      await this.userService.getRegistrationInExchangeOracles(request.user);

    return { oracleAddresses };
  }

  @Get('/me')
  async me(@Req() request: RequestWithUser) {
    const user = await this.userRepository.findOneById(request.user.id);
    logger.debug('/me endpoint user from repository', {
      user,
    });
    return user;
  }
}
