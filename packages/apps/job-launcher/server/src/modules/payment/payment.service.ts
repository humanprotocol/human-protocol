import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ConflictException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { BigNumber, providers } from 'ethers';
import { ErrorPayment } from '../../common/constants/errors';
import { PaymentRepository } from './payment.repository';
import { CurrencyService } from './currency.service';
import {
  PaymentCryptoCreateDto,
  PaymentFiatConfirmDto,
  PaymentFiatCreateDto,
} from './payment.dto';
import {
  Currency,
  PaymentFiatMethodType,
  PaymentSource,
  PaymentStatus,
  PaymentType,
  TokenId,
} from '../../common/enums/payment';
import { TX_CONFIRMATION_TRESHOLD } from '../../common/constants';
import { networkMap } from '../../common/constants/network';
import { ConfigNames } from '../../common/config';
import { IClientSecret, IResponseBool } from 'src/common/interfaces';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private stripe: Stripe;

  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly currencyService: CurrencyService,
    private configService: ConfigService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>(ConfigNames.STRIPE_SECRET_KEY)!,
      {
        apiVersion: this.configService.get<any>(ConfigNames.STRIPE_API_VERSION)!,
        appInfo: {
          name: this.configService.get<string>(ConfigNames.STRIPE_APP_NAME, 'Fortune')!,
          version: this.configService.get<string>(ConfigNames.STRIPE_APP_VERSION)!,
          url: this.configService.get<string>(ConfigNames.STRIPE_APP_INFO_URL)!,
        },
      },
    );
  }

  public async createCustomer(email: string): Promise<string> {
    const customer = await this.stripe.customers.create({
      email,
    });

    if (!customer) {
      this.logger.log(ErrorPayment.CustomerNotCreated, PaymentService.name);
      throw new NotFoundException(ErrorPayment.CustomerNotCreated);
    }

    return customer.id;
  }

  public async createFiatPayment(
    customerId: string,
    dto: PaymentFiatCreateDto,
  ): Promise<IClientSecret> {
    const { amount, currency } = dto;

    const params: Stripe.PaymentIntentCreateParams = {
      payment_method_types: [PaymentFiatMethodType.CARD],
      amount: amount * 100,
      currency: currency,
    };

    params.confirm = true;
    params.customer = customerId;
    params.payment_method_options = {};

    const paymentIntent = await this.stripe.paymentIntents.create(params);

    if (!paymentIntent.client_secret) {
      this.logger.log(ErrorPayment.ClientSecretDoesNotExist, PaymentService.name);
      throw new NotFoundException(ErrorPayment.ClientSecretDoesNotExist);
    }

    return {
      clientSecret: paymentIntent.client_secret,
    };
  }

  public async confirmFiatPayment(
    userId: number,
    dto: PaymentFiatConfirmDto,
  ): Promise<IResponseBool> {
    const paymentData = await this.getPayment(dto.paymentId);

    if (!paymentData) {
      this.logger.log(ErrorPayment.NotFound, PaymentService.name);
      throw new NotFoundException(ErrorPayment.NotFound);
    }

    if (
      paymentData?.status?.toUpperCase() !== PaymentStatus.SUCCEEDED
    ) {
      this.logger.log(ErrorPayment.NotSuccess, PaymentService.name);
      throw new BadRequestException(ErrorPayment.NotSuccess);
    }

    await this.savePayment(
      userId,
      PaymentSource.FIAT,
      PaymentType.DEPOSIT,
      BigNumber.from(paymentData.amount),
    );

    return {
      response: true
    }
  }

  public async createCryptoPayment(
    userId: number,
    dto: PaymentCryptoCreateDto,
  ): Promise<IResponseBool> {
    const provider = new providers.JsonRpcProvider(
      Object.values(networkMap).find(
        (item) => item.network.chainId === dto.chainId,
      )?.rpcUrl,
    );

    const transaction = await provider.getTransactionReceipt(
      dto.transactionHash,
    );

    if (!transaction) {
      this.logger.error(ErrorPayment.TransactionNotFoundByHash);
      throw new NotFoundException(ErrorPayment.TransactionNotFoundByHash);
    }

    if (!transaction.logs[0] || !transaction.logs[0].data) {
      this.logger.error(ErrorPayment.InvalidTransactionData);
      throw new NotFoundException(ErrorPayment.InvalidTransactionData);
    }

    if (transaction.confirmations < TX_CONFIRMATION_TRESHOLD) {
      this.logger.error(
        `Transaction has ${transaction.confirmations} confirmations instead of ${TX_CONFIRMATION_TRESHOLD}`,
      );
      throw new NotFoundException(
        ErrorPayment.TransactionHasNotEnoughAmountOfConfirmations,
      );
    }

    const amount = BigInt(transaction.logs[0].data).toString();

    const paymentEntity = await this.paymentRepository.findOne({
      transactionHash: transaction.transactionHash,
    });

    if (paymentEntity) {
      this.logger.log(
        ErrorPayment.TransactionHashAlreadyExists,
        PaymentRepository.name,
      );
      throw new BadRequestException(
        ErrorPayment.TransactionHashAlreadyExists,
      );
    }

    await this.savePayment(
      userId,
      PaymentSource.CRYPTO,
      PaymentType.DEPOSIT,
      BigNumber.from(amount),
    );

    return {
      response: true
    }
  }

  public async getPayment(
    paymentId: string,
  ): Promise<Stripe.Response<Stripe.PaymentIntent> | null> {
    return this.stripe.paymentIntents.retrieve(paymentId);
  }

  public async savePayment(
    userId: number,
    source: PaymentSource,
    type: PaymentType,
    amount: BigNumber,
  ): Promise<boolean> {
    const { rate } = await this.currencyService.getRate(
      TokenId.HUMAN_PROTOCOL,
      Currency.USD,
    );

    const paymentEntity = await this.paymentRepository.create({
      userId,
      amount: amount.toString(),
      currency: Currency.USD,
      source,
      rate,
      type,
    });

    if (!paymentEntity) {
      this.logger.log(ErrorPayment.NotFound, PaymentService.name);
      throw new NotFoundException(ErrorPayment.NotFound);
    }

    return true;
  }

  public async getUserBalance(userId: number): Promise<BigNumber> {
    const paymentEntities = await this.paymentRepository.find({ userId });

    let finalAmount = BigNumber.from(0);

    paymentEntities.forEach((payment) => {
      if (payment.type === PaymentType.WITHDRAWAL) {
        finalAmount = finalAmount.sub(payment.amount);
      } else {
        finalAmount = finalAmount.add(payment.amount);
      }
    });

    return finalAmount;
  }
}
