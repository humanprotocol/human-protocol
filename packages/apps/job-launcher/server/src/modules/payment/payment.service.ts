import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
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

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private stripe: Stripe;
  private endpointSecrete: string;

  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly currencyService: CurrencyService,
    private configService: ConfigService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY', 'secrete-key'),
      {
        apiVersion: this.configService.get<any>(
          'STRIPE_API_VERSION',
          '2022-11-15',
        ),
        appInfo: {
          name: this.configService.get<string>('NAME', 'Fortune'),
          version: this.configService.get<string>('VERSION'),
          url: this.configService.get<string>('STRIPE_APP_INFO_URL'),
        },
      },
    );
    this.endpointSecrete = this.configService.get(
      'STRIPE_ENDPOINT_SECRETE',
      'secrete-key',
    );
  }

  public async createCustomer(email: string): Promise<string> {
    try {
      const customer = await this.stripe.customers.create({
        email,
      });

      if (!customer) {
        this.logger.log(ErrorPayment.CustomerNotCreated, PaymentService.name);
        throw new NotFoundException(ErrorPayment.CustomerNotCreated);
      }

      return customer.id;
    } catch (e) {
      this.logger.log(ErrorPayment.CustomerNotCreated, PaymentService.name);
      throw new BadRequestException(ErrorPayment.CustomerNotCreated);
    }
  }

  public async createFiatPayment(
    customerId: string,
    dto: PaymentFiatCreateDto,
  ) {
    try {
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

      return {
        clientSecret: paymentIntent.client_secret,
      };
    } catch (e) {
      this.logger.log(ErrorPayment.IntentNotCreated, PaymentService.name);
      throw new BadRequestException(ErrorPayment.IntentNotCreated);
    }
  }

  public async confirmFiatPayment(
    userId: number,
    dto: PaymentFiatConfirmDto,
  ): Promise<boolean> {
    try {
      const paymentData = await this.getPayment(dto.paymentId);

      if (!paymentData) {
        this.logger.log(ErrorPayment.NotFound, PaymentService.name);
        throw new NotFoundException(ErrorPayment.NotFound);
      }

      if (
        !paymentData ||
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

      return true;
    } catch (e) {
      throw new Error(e);
    }
  }

  public async createCryptoPayment(
    userId: number,
    dto: PaymentCryptoCreateDto,
  ) {
    try {
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

      return true;
    } catch (e) {
      throw new Error(e);
    }
  }

  public async savePayment(
    userId: number,
    source: PaymentSource,
    type: PaymentType,
    amount: BigNumber,
  ): Promise<boolean> {
    const rate = await this.currencyService.getRate(
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

  public async getPayment(
    paymentId: string,
  ): Promise<Stripe.Response<Stripe.PaymentIntent> | null> {
    return this.stripe.paymentIntents.retrieve(paymentId);
  }

  public async getUserBalance(userId: number): Promise<BigNumber> {
    const paymentEntities = await this.paymentRepository.find({ userId });

    const finalAmount = BigNumber.from(0);

    paymentEntities.forEach((payment) => {
      if (payment.type === PaymentType.WITHDRAWAL) {
        finalAmount.sub(payment.amount);
      } else {
        finalAmount.add(payment.amount);
      }
    });

    return finalAmount;
  }
}
