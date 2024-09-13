import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { ethers } from 'ethers';
import { ErrorPayment } from '../../common/constants/errors';
import { PaymentRepository } from './payment.repository';
import {
  CardConfirmDto,
  PaymentCryptoCreateDto,
  PaymentFiatConfirmDto,
  PaymentFiatCreateDto,
  PaymentRefundCreateDto,
} from './payment.dto';
import {
  Currency,
  PaymentSource,
  PaymentStatus,
  PaymentType,
  StripePaymentStatus,
  TokenId,
} from '../../common/enums/payment';
import { TX_CONFIRMATION_TRESHOLD } from '../../common/constants';
import { NetworkConfigService } from '../../common/config/network-config.service';
import { StripeConfigService } from '../../common/config/stripe-config.service';
import {
  HMToken,
  HMToken__factory,
} from '@human-protocol/core/typechain-types';
import { Web3Service } from '../web3/web3.service';
import { CoingeckoTokenId } from '../../common/constants/payment';
import { add, div, eq, mul } from '../../common/utils/decimal';
import { verifySignature } from '../../common/utils/signature';
import { PaymentEntity } from './payment.entity';
import { ControlledError } from '../../common/errors/controlled';
import { RateService } from './rate.service';
import { UserEntity } from '../user/user.entity';
import { PaymentInfoRepository } from './payment-info.repository';
import { PaymentInfoEntity } from './payment-info.entity';
import { JobEntity } from '../job/job.entity';
import { ServerConfigService } from '../../common/config/server-config.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private stripe: Stripe;

  constructor(
    private readonly networkConfigService: NetworkConfigService,
    private readonly web3Service: Web3Service,
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentInfoRepository: PaymentInfoRepository,
    private stripeConfigService: StripeConfigService,
    private rateService: RateService,
    private serverConfigService: ServerConfigService,
  ) {
    this.stripe = new Stripe(this.stripeConfigService.secretKey, {
      apiVersion: this.stripeConfigService.apiVersion as any,
      appInfo: {
        name: this.stripeConfigService.appName,
        version: this.stripeConfigService.appVersion,
        url: this.stripeConfigService.appInfoURL,
      },
    });
  }

  public async createCustomerAndAssignCard(user: UserEntity): Promise<string> {
    let setupIntent: Stripe.Response<Stripe.SetupIntent>;

    if (!!user.paymentInfo) {
      this.logger.log(ErrorPayment.CardAssigned, PaymentService.name);
      throw new ControlledError(
        ErrorPayment.CardAssigned,
        HttpStatus.NOT_FOUND,
      );
    }

    try {
      const customer = await this.stripe.customers.create({
        email: user.email,
      });

      setupIntent = await this.stripe.setupIntents.create({
        automatic_payment_methods: {
          enabled: true,
        },
        customer: customer.id,
      });
    } catch (error) {
      this.logger.log(error.message, PaymentService.name);
      throw new ControlledError(
        ErrorPayment.CardNotAssigned,
        HttpStatus.NOT_FOUND,
      );
    }

    if (!setupIntent?.client_secret) {
      this.logger.log(
        ErrorPayment.ClientSecretDoesNotExist,
        PaymentService.name,
      );
      throw new ControlledError(
        ErrorPayment.ClientSecretDoesNotExist,
        HttpStatus.NOT_FOUND,
      );
    }

    return setupIntent.client_secret;
  }

  public async confirmCard(
    user: UserEntity,
    data: CardConfirmDto,
  ): Promise<boolean> {
    const setup = await this.stripe.setupIntents.retrieve(data.setupId);

    if (!setup) {
      this.logger.log(ErrorPayment.SetupNotFound, PaymentService.name);
      throw new ControlledError(
        ErrorPayment.SetupNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.stripe.customers.update(<string>setup.customer, {
      invoice_settings: {
        default_payment_method: <string>setup.payment_method,
      },
    });

    const paymentInfo = new PaymentInfoEntity();
    paymentInfo.user = user;
    paymentInfo.customerId = setup.customer as string;
    paymentInfo.paymentMethodId = setup.payment_method as string;
    await this.paymentInfoRepository.createUnique(paymentInfo);

    return true;
  }

  public async createFiatPayment(
    user: UserEntity,
    dto: PaymentFiatCreateDto,
  ): Promise<string> {
    const { amount, currency } = dto;

    const amountInCents = Math.ceil(mul(amount, 100));
    const params: Stripe.PaymentIntentCreateParams = {
      amount: amountInCents,
      currency: currency,
      customer: user.paymentInfo.customerId,
      payment_method: user.paymentInfo.paymentMethodId,
      off_session: false,
    };

    const paymentIntent = await this.stripe.paymentIntents.create(params);

    if (!paymentIntent?.client_secret) {
      throw new ControlledError(
        ErrorPayment.ClientSecretDoesNotExist,
        HttpStatus.NOT_FOUND,
      );
    }

    const paymentEntity = await this.paymentRepository.findOneByTransaction(
      paymentIntent.id,
    );

    if (paymentEntity) {
      throw new ControlledError(
        ErrorPayment.TransactionAlreadyExists,
        HttpStatus.BAD_REQUEST,
      );
    }

    const rate = await this.rateService.getRate(currency, Currency.USD);

    const newPaymentEntity = new PaymentEntity();
    Object.assign(newPaymentEntity, {
      userId: user.id,
      source: PaymentSource.FIAT,
      type: PaymentType.DEPOSIT,
      amount: div(amountInCents, 100),
      currency,
      rate,
      transaction: paymentIntent.id,
      status: PaymentStatus.PENDING,
    });
    await this.paymentRepository.createUnique(newPaymentEntity);

    return paymentIntent.client_secret;
  }

  public async confirmFiatPayment(
    userId: number,
    data: PaymentFiatConfirmDto,
  ): Promise<boolean> {
    const paymentData = await this.stripe.paymentIntents.retrieve(
      data.paymentId,
    );

    if (!paymentData) {
      throw new ControlledError(ErrorPayment.NotFound, HttpStatus.NOT_FOUND);
    }

    const paymentEntity = await this.paymentRepository.findOneByTransaction(
      data.paymentId,
    );
    if (
      !paymentEntity ||
      paymentEntity.userId !== userId ||
      paymentEntity.status !== PaymentStatus.PENDING ||
      !eq(paymentEntity.amount, div(paymentData.amount_received, 100)) ||
      paymentEntity.currency !== paymentData.currency
    ) {
      throw new ControlledError(ErrorPayment.NotFound, HttpStatus.NOT_FOUND);
    }

    if (
      paymentData?.status === StripePaymentStatus.CANCELED ||
      paymentData?.status === StripePaymentStatus.REQUIRES_PAYMENT_METHOD
    ) {
      paymentEntity.status = PaymentStatus.FAILED;
      await this.paymentRepository.updateOne(paymentEntity);
      throw new ControlledError(
        ErrorPayment.NotSuccess,
        HttpStatus.BAD_REQUEST,
      );
    } else if (paymentData?.status !== StripePaymentStatus.SUCCEEDED) {
      return false; // TODO: Handling other cases
    }

    paymentEntity.status = PaymentStatus.SUCCEEDED;
    await this.paymentRepository.updateOne(paymentEntity);

    return true;
  }

  public async createCryptoPayment(
    userId: number,
    dto: PaymentCryptoCreateDto,
    signature: string,
  ): Promise<boolean> {
    this.web3Service.validateChainId(dto.chainId);
    const network = this.networkConfigService.networks.find(
      (item) => item.chainId === dto.chainId,
    );
    const provider = new ethers.JsonRpcProvider(network?.rpcUrl);

    const transaction = await provider.getTransactionReceipt(
      dto.transactionHash,
    );

    if (!transaction) {
      throw new ControlledError(
        ErrorPayment.TransactionNotFoundByHash,
        HttpStatus.NOT_FOUND,
      );
    }

    verifySignature(dto, signature, [transaction.from]);

    if (!transaction.logs[0] || !transaction.logs[0].data) {
      throw new ControlledError(
        ErrorPayment.InvalidTransactionData,
        HttpStatus.NOT_FOUND,
      );
    }

    if ((await transaction.confirmations()) < TX_CONFIRMATION_TRESHOLD) {
      this.logger.error(
        `Transaction has ${transaction.confirmations} confirmations instead of ${TX_CONFIRMATION_TRESHOLD}`,
      );
      throw new ControlledError(
        ErrorPayment.TransactionHasNotEnoughAmountOfConfirmations,
        HttpStatus.NOT_FOUND,
      );
    }

    const signer = this.web3Service.getSigner(dto.chainId);
    const tokenAddress = transaction.logs[0].address;

    const tokenContract: HMToken = HMToken__factory.connect(
      tokenAddress,
      signer,
    );

    if (
      ethers.hexlify(
        tokenContract.interface.parseLog({
          topics: transaction.logs[0].topics as string[],
          data: transaction.logs[0].data,
        })?.args['_to'],
      ) !== ethers.hexlify(signer.address)
    ) {
      throw new ControlledError(
        ErrorPayment.InvalidRecipient,
        HttpStatus.CONFLICT,
      );
    }

    const tokenId = (await tokenContract.symbol()).toLowerCase();
    const amount = Number(ethers.formatEther(transaction.logs[0].data));

    if (
      network?.tokens[tokenId] != tokenAddress ||
      !CoingeckoTokenId[tokenId]
    ) {
      throw new ControlledError(
        ErrorPayment.UnsupportedToken,
        HttpStatus.CONFLICT,
      );
    }

    const paymentEntity = await this.paymentRepository.findOneByTransaction(
      transaction.hash,
      dto.chainId,
    );

    if (paymentEntity) {
      throw new ControlledError(
        ErrorPayment.TransactionAlreadyExists,
        HttpStatus.BAD_REQUEST,
      );
    }

    const rate = await this.rateService.getRate(tokenId, Currency.USD);

    const newPaymentEntity = new PaymentEntity();
    Object.assign(newPaymentEntity, {
      userId,
      source: PaymentSource.CRYPTO,
      type: PaymentType.DEPOSIT,
      amount: amount,
      currency: tokenId,
      rate,
      chainId: dto.chainId,
      transaction: dto.transactionHash,
      status: PaymentStatus.SUCCEEDED,
    });
    await this.paymentRepository.createUnique(newPaymentEntity);

    return true;
  }

  public async getUserBalance(userId: number, rate?: number): Promise<number> {
    const paymentEntities = await this.paymentRepository.findByUserAndStatus(
      userId,
      PaymentStatus.SUCCEEDED,
    );
    if (!rate) {
      rate = await this.rateService.getRate(TokenId.HMT, Currency.USD);
    }
    const totalAmount = paymentEntities.reduce((total, payment) => {
      if (payment.currency === TokenId.HMT) {
        return add(total, mul(payment.amount, rate));
      }
      return add(total, payment.amount);
    }, 0);

    return totalAmount;
  }

  public async createRefundPayment(dto: PaymentRefundCreateDto) {
    const rate = await this.rateService.getRate(TokenId.HMT, Currency.USD);

    const paymentEntity = new PaymentEntity();
    Object.assign(paymentEntity, {
      userId: dto.userId,
      jobId: dto.jobId,
      source: PaymentSource.BALANCE,
      type: PaymentType.REFUND,
      amount: dto.refundAmount,
      currency: TokenId.HMT,
      rate,
      status: PaymentStatus.SUCCEEDED,
    });
    await this.paymentRepository.createUnique(paymentEntity);
  }
  public async createSlash(job: JobEntity): Promise<void> {
    const amount = this.serverConfigService.abuseAmount,
      currency = Currency.USD;

    const paymentInfo = await this.paymentInfoRepository.findOneByUser(
      job.userId,
    );
    if (!paymentInfo) {
      this.logger.log(ErrorPayment.CustomerNotFound, PaymentService.name);
      throw new ControlledError(
        ErrorPayment.CustomerNotFound,
        HttpStatus.BAD_REQUEST,
      );
    }

    const amountInCents = Math.ceil(mul(amount, 100));
    const params: Stripe.PaymentIntentCreateParams = {
      amount: amountInCents,
      currency: currency,
      customer: paymentInfo.customerId,
      payment_method: paymentInfo.paymentMethodId,
      off_session: true,
      confirm: true,
    };

    const paymentIntent = await this.stripe.paymentIntents.create(params);

    if (!paymentIntent?.client_secret) {
      this.logger.log(
        ErrorPayment.ClientSecretDoesNotExist,
        PaymentService.name,
      );
      throw new ControlledError(
        ErrorPayment.ClientSecretDoesNotExist,
        HttpStatus.BAD_REQUEST,
      );
    }

    const newPaymentEntity = new PaymentEntity();
    Object.assign(newPaymentEntity, {
      userId: job.user.id,
      source: PaymentSource.FIAT,
      type: PaymentType.DEPOSIT,
      amount: div(amountInCents, 100),
      currency,
      rate: 1,
      transaction: paymentIntent.id,
      status: PaymentStatus.SUCCEEDED,
    });
    await this.paymentRepository.createUnique(newPaymentEntity);

    Object.assign(newPaymentEntity, {
      userId: job.user.id,
      source: PaymentSource.FIAT,
      type: PaymentType.SLASH,
      amount: div(-amountInCents, 100),
      currency,
      rate: 1,
      transaction: null,
      status: PaymentStatus.SUCCEEDED,
    });
    await this.paymentRepository.createUnique(newPaymentEntity);

    return;
  }
}
