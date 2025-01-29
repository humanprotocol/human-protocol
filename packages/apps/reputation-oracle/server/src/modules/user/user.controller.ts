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
  RegistrationInExchangeOracleDto,
  RegistrationInExchangeOraclesDto,
  RegistrationInExchangeOracleResponseDto,
} from './user.dto';
import { JwtAuthGuard } from '../../common/guards';
import { HCaptchaGuard } from '../../common/guards/hcaptcha';
import { RequestWithUser } from '../../common/types';
import { prepareSignatureBody } from '../../common/utils/signature';
import { UserService } from './user.service';
import { Public } from '../../common/decorators';
import { KycSignedAddressDto } from '../kyc/kyc.dto';
import { Web3Service } from '../web3/web3.service';
import { UserRepository } from './user.repository';
import { SignatureType } from '../../common/enums/web3';

@ApiTags('User')
@Controller('/user')
@ApiBearerAuth()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly web3Service: Web3Service,
    private readonly userRepository: UserRepository,
  ) {}

  @Post('/register-labeler')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
    let nonce;
    if (data.type === SignatureType.SIGNIN) {
      nonce = (await this.userRepository.findOneByAddress(data.address))?.nonce;
    }
    return prepareSignatureBody({
      from: data.address,
      to: this.web3Service.getOperatorAddress(),
      contents: data.type,
      nonce,
    });
  }

  @Post('/exchange-oracle-registration')
  @HttpCode(200)
  @UseGuards(HCaptchaGuard, JwtAuthGuard)
  @ApiOperation({
    summary: 'Notifies registration in Exchange Oracle completed',
    description:
      'Notifies that the registration process in a Exchange Oracle has been completed by the user.',
  })
  @ApiBody({ type: RegistrationInExchangeOracleDto })
  @ApiResponse({
    status: 200,
    description: 'Oracle registered successfully',
    type: RegistrationInExchangeOracleDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Invalid input parameters.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  public async registrationInExchangeOracle(
    @Req() request: RequestWithUser,
    @Body() data: RegistrationInExchangeOracleDto,
  ): Promise<RegistrationInExchangeOracleResponseDto> {
    await this.userService.registrationInExchangeOracle(
      request.user,
      data.oracleAddress,
    );

    return { oracleAddress: data.oracleAddress };
  }

  @Get('/exchange-oracle-registration')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
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
  public async getRegistrationInExchangeOracles(
    @Req() request: RequestWithUser,
  ): Promise<RegistrationInExchangeOraclesDto> {
    const oracleAddresses =
      await this.userService.getRegistrationInExchangeOracles(request.user);
    return { oracleAddresses };
  }
}
