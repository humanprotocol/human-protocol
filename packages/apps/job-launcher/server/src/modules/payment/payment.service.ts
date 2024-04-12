import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
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
import { networkMap } from '../../common/config';
import { StripeConfigService } from '../../common/config/stripe-config.service';
import {
  HMToken,
  HMToken__factory,
} from '@human-protocol/core/typechain-types';
import { Web3Service } from '../web3/web3.service';
import { CoingeckoTokenId } from '../../common/constants/payment';
import { getRate } from '../../common/utils';
import { add, div, eq, mul } from '../../common/utils/decimal';
import { verifySignature } from '../../common/utils/signature';
import { PaymentEntity } from './payment.entity';
import { UserEntity } from '../user/user.entity';
import { PaymentInfoRepository } from './payment-info.repository';
import { PaymentInfoEntity } from './payment-info.entity';
import { JobEntity } from '../job/job.entity';
import { ServerConfigService } from 'src/common/config/server-config.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private stripe: Stripe;

  constructor(
    private readonly web3Service: Web3Service,
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentInfoRepository: PaymentInfoRepository,
    private stripeConfigService: StripeConfigService,
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
      throw new NotFoundException(ErrorPayment.CardAssigned);
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
      throw new NotFoundException(ErrorPayment.CardNotAssigned);
    }

    if (!setupIntent.client_secret) {
      this.logger.log(
        ErrorPayment.ClientSecretDoesNotExist,
        PaymentService.name,
      );
      throw new NotFoundException(ErrorPayment.ClientSecretDoesNotExist);
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
      throw new NotFoundException(ErrorPayment.SetupNotFound);
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

    if (!paymentIntent.client_secret) {
      this.logger.log(
        ErrorPayment.ClientSecretDoesNotExist,
        PaymentService.name,
      );
      throw new NotFoundException(ErrorPayment.ClientSecretDoesNotExist);
    }

    const paymentEntity = await this.paymentRepository.findOneByTransaction(
      paymentIntent.id,
    );

    if (paymentEntity) {
      this.logger.log(
        ErrorPayment.TransactionAlreadyExists,
        PaymentRepository.name,
      );
      throw new BadRequestException(ErrorPayment.TransactionAlreadyExists);
    }

    const rate = await getRate(currency, Currency.USD);

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
      this.logger.log(ErrorPayment.NotFound, PaymentService.name);
      throw new NotFoundException(ErrorPayment.NotFound);
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
      this.logger.log(ErrorPayment.NotFound, PaymentRepository.name);
      throw new NotFoundException(ErrorPayment.NotFound);
    }

    if (
      paymentData?.status === StripePaymentStatus.CANCELED ||
      paymentData?.status === StripePaymentStatus.REQUIRES_PAYMENT_METHOD
    ) {
      paymentEntity.status = PaymentStatus.FAILED;
      await this.paymentRepository.updateOne(paymentEntity);
      this.logger.log(ErrorPayment.NotSuccess, PaymentService.name);
      throw new BadRequestException(ErrorPayment.NotSuccess);
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
    const network = Object.values(networkMap).find(
      (item) => item.chainId === dto.chainId,
    );
    const provider = new ethers.JsonRpcProvider(network?.rpcUrl);

    const transaction = await provider.getTransactionReceipt(
      dto.transactionHash,
    );

    if (!transaction) {
      this.logger.error(ErrorPayment.TransactionNotFoundByHash);
      throw new NotFoundException(ErrorPayment.TransactionNotFoundByHash);
    }

    verifySignature(dto, signature, [transaction.from]);

    if (!transaction.logs[0] || !transaction.logs[0].data) {
      this.logger.error(ErrorPayment.InvalidTransactionData);
      throw new NotFoundException(ErrorPayment.InvalidTransactionData);
    }

    if ((await transaction.confirmations()) < TX_CONFIRMATION_TRESHOLD) {
      this.logger.error(
        `Transaction has ${transaction.confirmations} confirmations instead of ${TX_CONFIRMATION_TRESHOLD}`,
      );
      throw new NotFoundException(
        ErrorPayment.TransactionHasNotEnoughAmountOfConfirmations,
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
      this.logger.error(ErrorPayment.InvalidRecipient);
      throw new ConflictException(ErrorPayment.InvalidRecipient);
    }

    const tokenId = (await tokenContract.symbol()).toLowerCase();
    const amount = Number(ethers.formatEther(transaction.logs[0].data));

    if (
      network?.tokens[tokenId] != tokenAddress ||
      !CoingeckoTokenId[tokenId]
    ) {
      this.logger.log(ErrorPayment.UnsupportedToken, PaymentRepository.name);
      throw new ConflictException(ErrorPayment.UnsupportedToken);
    }

    const paymentEntity = await this.paymentRepository.findOneByTransaction(
      transaction.hash,
      dto.chainId,
    );

    if (paymentEntity) {
      this.logger.log(
        ErrorPayment.TransactionAlreadyExists,
        PaymentRepository.name,
      );
      throw new BadRequestException(ErrorPayment.TransactionAlreadyExists);
    }

    const rate = await getRate(tokenId, Currency.USD);

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

  public async getUserBalance(userId: number): Promise<number> {
    const paymentEntities = await this.paymentRepository.findByUserAndStatus(
      userId,
      PaymentStatus.SUCCEEDED,
    );

    const totalAmount = paymentEntities.reduce((total, payment) => {
      return add(total, mul(payment.amount, payment.rate));
    }, 0);

    return totalAmount;
  }

  public async createRefundPayment(dto: PaymentRefundCreateDto) {
    const rate = await getRate(TokenId.HMT, Currency.USD);

    const paymentEntity = new PaymentEntity();
    Object.assign(paymentEntity, {
      userId: dto.userId,
      jobId: dto.jobId,
      source: PaymentSource.FIAT,
      type: PaymentType.SLASH,
      amount: dto.refundAmount,
      currency: TokenId.USDT,
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
      throw new BadRequestException(ErrorPayment.CustomerNotFound);
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

    if (!paymentIntent.client_secret) {
      this.logger.log(
        ErrorPayment.ClientSecretDoesNotExist,
        PaymentService.name,
      );
      throw new BadRequestException(ErrorPayment.ClientSecretDoesNotExist);
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
