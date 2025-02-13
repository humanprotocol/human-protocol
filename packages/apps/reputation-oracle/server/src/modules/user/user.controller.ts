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
import {
  DisableOperatorDto,
  PrepareSignatureDto,
  RegisterAddressRequestDto,
  SignatureBodyDto,
  RegisterLabelerResponseDto,
  EnableOperatorDto,
  RegistrationInExchangeOracleDto,
  RegistrationInExchangeOraclesDto,
  RegistrationInExchangeOracleResponseDto,
} from './user.dto';
import { JwtAuthGuard } from '../../common/guards';
import { HCaptchaGuard } from '../../common/guards/hcaptcha';
import { RequestWithUser } from '../../common/interfaces/request';
import { prepareSignatureBody } from '../../utils/web3';
import { UserService } from './user.service';
import { Public } from '../../common/decorators';
import { KycSignedAddressDto } from '../kyc/kyc.dto';
import { Web3Service } from '../web3/web3.service';
import { UserRepository } from './user.repository';
import { SignatureType } from '../../common/enums/web3';
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
@Controller('/user')
@UseFilters(UserErrorFilter)
@ApiBearerAuth()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly web3Service: Web3Service,
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
  @UseGuards(JwtAuthGuard)
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
    type: KycSignedAddressDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Provided address already registered',
  })
  @UseGuards(JwtAuthGuard)
  @Post('/register-address')
  @HttpCode(200)
  async registerAddress(
    @Req() request: RequestWithUser,
    @Body() data: RegisterAddressRequestDto,
  ): Promise<KycSignedAddressDto> {
    const registrationResult = await this.userService.registerAddress(
      request.user,
      data,
    );
    return registrationResult;
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
    let nonce;
    if (data.type === SignatureType.SIGNIN) {
      nonce = (await this.userRepository.findOneByAddress(data.address))?.nonce;
    }

    const preparedSignatureBody = await prepareSignatureBody({
      from: data.address,
      to: this.web3Service.getOperatorAddress(),
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
  @UseGuards(HCaptchaGuard, JwtAuthGuard)
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
    type: RegistrationInExchangeOraclesDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  @UseGuards(JwtAuthGuard)
  @Get('/exchange-oracle-registration')
  async getRegistrationInExchangeOracles(
    @Req() request: RequestWithUser,
  ): Promise<RegistrationInExchangeOraclesDto> {
    const oracleAddresses =
      await this.userService.getRegistrationInExchangeOracles(request.user);

    return { oracleAddresses };
  }
}
