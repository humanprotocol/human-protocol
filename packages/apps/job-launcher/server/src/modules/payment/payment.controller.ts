import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
  Headers,
  HttpStatus,
  Patch,
  Delete,
  Param,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards';
import { RequestWithUser } from '../../common/types';

import {
  BillingInfoDto,
  BillingInfoUpdateDto,
  CardConfirmDto,
  GetPaymentsDto,
  GetRateDto,
  PaymentCryptoCreateDto,
  PaymentDto,
  PaymentFiatConfirmDto,
  PaymentFiatCreateDto,
  PaymentMethodIdDto,
} from './payment.dto';
import { PaymentService } from './payment.service';
import { HEADER_SIGNATURE_KEY } from '../../common/constants';
import { ControlledError } from '../../common/errors/controlled';
import { ServerConfigService } from '../../common/config/server-config.service';
import { RateService } from './rate.service';
import { PageDto } from '../../common/pagination/pagination.dto';
import { WhitelistAuthGuard } from '../../common/guards/whitelist.auth';
import { Web3Env } from '../../common/enums/web3';
import { Web3ConfigService } from '../../common/config/web3-config.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('Payment')
@Controller('/payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly serverConfigService: ServerConfigService,
    private readonly rateService: RateService,
    private readonly web3ConfigService: Web3ConfigService,
  ) {}

  @ApiOperation({
    summary: 'Create a crypto payment',
    description: 'Endpoint to create a new crypto payment.',
  })
  @ApiBody({ type: PaymentCryptoCreateDto })
  @ApiResponse({
    status: 200,
    description: 'Crypto payment created successfully',
    type: Boolean,
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
  @ApiResponse({
    status: 409,
    description: 'Conflict. Conflict with the current state of the server.',
  })
  @UseGuards(WhitelistAuthGuard)
  @Post('/crypto')
  public async createCryptoPayment(
    @Headers(HEADER_SIGNATURE_KEY) signature: string,
    @Body() data: PaymentCryptoCreateDto,
    @Request() req: RequestWithUser,
  ): Promise<boolean> {
    return this.paymentService.createCryptoPayment(
      req.user.id,
      data,
      signature,
    );
  }

  @ApiOperation({
    summary: 'Get exchange rates',
    description: 'Endpoint to get exchange rates.',
  })
  @ApiResponse({
    status: 200,
    description: 'Exchange rates retrieved successfully',
    type: Number,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Could not find the requested content.',
  })
  @Get('/rates')
  public async getRate(@Query() data: GetRateDto): Promise<number> {
    try {
      return this.rateService.getRate(data.from, data.to);
    } catch (e) {
      throw new ControlledError(
        'Error getting rates',
        HttpStatus.CONFLICT,
        e.stack,
      );
    }
  }

  @ApiOperation({
    summary: 'Get Job Launcher minimum fee',
    description: 'Endpoint to get Job Launcher minimum fee in USD.',
  })
  @ApiResponse({
    status: 200,
    description: 'Minimum fee retrieved successfully',
    type: Number,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Could not find the requested content.',
  })
  @Get('/min-fee')
  public async getMinFee(): Promise<number> {
    return this.serverConfigService.minimumFeeUsd;
  }

  @ApiOperation({
    summary: 'Assign a card to a user',
    description: 'Endpoint to assign a card to an user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment created successfully',
    type: String,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Could not find the requested content.',
  })
  @Post('/fiat/setup-card')
  public async assignCard(@Request() req: RequestWithUser): Promise<string> {
    if (this.web3ConfigService.env === Web3Env.MAINNET) {
      throw new ControlledError(
        'Temporally disabled',
        HttpStatus.METHOD_NOT_ALLOWED,
      );
    }
    return this.paymentService.createCustomerAndAssignCard(req.user);
  }

  @ApiOperation({
    summary: 'Confirm a card',
    description:
      'Endpoint to confirm that a card was successfully assigned to an user.',
  })
  @ApiBody({ type: PaymentFiatConfirmDto })
  @ApiResponse({
    status: 200,
    description: 'Card confirmed successfully',
    type: Boolean,
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
  @Post('/fiat/confirm-card')
  public async confirmSetupCard(
    @Request() req: RequestWithUser,
    @Body() data: CardConfirmDto,
  ): Promise<boolean> {
    if (this.web3ConfigService.env === Web3Env.MAINNET) {
      throw new ControlledError(
        'Temporally disabled',
        HttpStatus.METHOD_NOT_ALLOWED,
      );
    }
    return this.paymentService.confirmCard(req.user, data);
  }

  @ApiOperation({
    summary: 'Create a fiat payment',
    description: 'Endpoint to create a new fiat payment.',
  })
  @ApiBody({ type: PaymentFiatCreateDto })
  @ApiResponse({
    status: 200,
    description: 'Payment created successfully',
    type: String,
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
  @Post('/fiat')
  public async createFiatPayment(
    @Body() data: PaymentFiatCreateDto,
    @Request() req: RequestWithUser,
  ): Promise<string> {
    if (this.web3ConfigService.env === Web3Env.MAINNET) {
      throw new ControlledError(
        'Temporally disabled',
        HttpStatus.METHOD_NOT_ALLOWED,
      );
    }
    return this.paymentService.createFiatPayment(req.user, data);
  }

  @ApiOperation({
    summary: 'Confirm a fiat payment',
    description: 'Endpoint to confirm a fiat payment.',
  })
  @ApiBody({ type: PaymentFiatConfirmDto })
  @ApiResponse({
    status: 200,
    description: 'Fiat payment confirmed successfully',
    type: Boolean,
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
  @Post('/fiat/confirm-payment')
  public async confirmFiatPayment(
    @Body() data: PaymentFiatConfirmDto,
    @Request() req: RequestWithUser,
  ): Promise<boolean> {
    if (this.web3ConfigService.env === Web3Env.MAINNET) {
      throw new ControlledError(
        'Temporally disabled',
        HttpStatus.METHOD_NOT_ALLOWED,
      );
    }
    return this.paymentService.confirmFiatPayment(req.user.id, data);
  }

  @ApiOperation({
    summary: 'List user cards',
    description: 'Fetches all cards associated with the user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cards retrieved successfully',
    type: Array,
  })
  @Get('/fiat/cards')
  public async listPaymentMethods(@Request() req: RequestWithUser) {
    if (this.web3ConfigService.env === Web3Env.MAINNET) {
      throw new ControlledError(
        'Temporally disabled',
        HttpStatus.METHOD_NOT_ALLOWED,
      );
    }
    return this.paymentService.listUserPaymentMethods(req.user);
  }

  @ApiOperation({
    summary: 'Delete a card',
    description:
      'Deletes a specific card. If the card is the default payment method and is in use, returns an error.',
  })
  @ApiResponse({
    status: 200,
    description: 'Card deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete default card that is in use by a job.',
  })
  @Delete('/fiat/card')
  public async deleteCard(
    @Request() req: RequestWithUser,
    @Query() data: PaymentMethodIdDto,
  ): Promise<void> {
    if (this.web3ConfigService.env === Web3Env.MAINNET) {
      throw new ControlledError(
        'Temporally disabled',
        HttpStatus.METHOD_NOT_ALLOWED,
      );
    }
    await this.paymentService.deletePaymentMethod(
      req.user,
      data.paymentMethodId,
    );
  }

  @ApiOperation({
    summary: 'Get user billing information',
    description: 'Fetches the billing information associated with the user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Billing information retrieved successfully',
    type: BillingInfoDto,
  })
  @Get('/fiat/billing-info')
  public async getBillingInfo(
    @Request() req: RequestWithUser,
  ): Promise<BillingInfoDto | null> {
    if (this.web3ConfigService.env === Web3Env.MAINNET) {
      throw new ControlledError(
        'Temporally disabled',
        HttpStatus.METHOD_NOT_ALLOWED,
      );
    }
    return this.paymentService.getUserBillingInfo(req.user);
  }

  @ApiOperation({
    summary: 'Edit user billing information',
    description: 'Updates the billing information associated with the user.',
  })
  @ApiBody({ type: BillingInfoUpdateDto })
  @ApiResponse({
    status: 200,
    description: 'Billing information updated successfully',
  })
  @Patch('/fiat/billing-info')
  public async editBillingInfo(
    @Request() req: RequestWithUser,
    @Body() data: BillingInfoUpdateDto,
  ): Promise<void> {
    if (this.web3ConfigService.env === Web3Env.MAINNET) {
      throw new ControlledError(
        'Temporally disabled',
        HttpStatus.METHOD_NOT_ALLOWED,
      );
    }
    await this.paymentService.updateUserBillingInfo(req.user, data);
  }

  @ApiOperation({
    summary: 'Change default payment method',
    description:
      'Sets a specific card as the default payment method for the user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Default payment method updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot set the specified card as default.',
  })
  @ApiBody({ type: PaymentMethodIdDto })
  @Patch('/fiat/default-card')
  public async changeDefaultCard(
    @Request() req: RequestWithUser,
    @Body() data: PaymentMethodIdDto,
  ): Promise<void> {
    if (this.web3ConfigService.env === Web3Env.MAINNET) {
      throw new ControlledError(
        'Temporally disabled',
        HttpStatus.METHOD_NOT_ALLOWED,
      );
    }
    await this.paymentService.changeDefaultPaymentMethod(
      req.user,
      data.paymentMethodId,
    );
  }

  @ApiOperation({
    summary: 'Get all payments',
    description:
      'Endpoint to retrieve all payments for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Payments retrieved successfully',
    type: [PaymentDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  @Get('/payments')
  async getAllPayments(
    @Query() data: GetPaymentsDto,
    @Request() req: RequestWithUser,
  ): Promise<PageDto<PaymentDto>> {
    return this.paymentService.getAllPayments(data, req.user.id);
  }

  @ApiOperation({
    summary: 'Get receipt for a payment',
    description: 'Endpoint to retrieve the receipt for a specific payment.',
  })
  @ApiResponse({
    status: 200,
    description: 'Receipt retrieved successfully',
    type: String,
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Could not find the requested payment or receipt.',
  })
  @Get('/receipt/:paymentId')
  async getReceipt(
    @Param('paymentId') paymentId: string,
    @Request() req: RequestWithUser,
  ) {
    if (this.web3ConfigService.env === Web3Env.MAINNET) {
      throw new ControlledError(
        'Temporally disabled',
        HttpStatus.METHOD_NOT_ALLOWED,
      );
    }
    return this.paymentService.getReceipt(paymentId, req.user);
  }
}
