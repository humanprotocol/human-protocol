import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { BigNumber, Signer } from 'ethers';
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
import { EthersSigner, InjectSignerProvider } from 'nestjs-ethers';
import { Wallet } from '@ethersproject/wallet';
import { TX_CONFIRMATION_TRESHOLD } from '../../common/constants';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private stripe: Stripe;
  private endpointSecrete: string;

  // TODO: add crypto variant
  constructor(
    @InjectSignerProvider()
    private readonly ethersSigner: EthersSigner,
    private readonly paymentRepository: PaymentRepository,
    private readonly currencyService: CurrencyService,
    private configService: ConfigService,
  ) {
    this.stripe = new Stripe(
      this.configService.get('STRIPE_SECRET_KEY', 'secrete-key'),
      {
        apiVersion: this.configService.get('STRIPE_API_VERSION', '2022-11-15'),
        appInfo: {
          name: this.configService.get('NAME', 'Fortune'),
          version: this.configService.get('VERSION'),
          url: this.configService.get('STRIPE_APP_INFO_URL'),
        },
      },
    );
    this.endpointSecrete = this.configService.get(
      'STRIPE_ENDPOINT_SECRETE',
      'secrete-key',
    );
  }

  public async createCustomer(email: string) {
    const customer = await this.stripe.customers.create({
      email,
    });

    if (!customer) {
      this.logger.log(ErrorPayment.CustomerNotFound, PaymentService.name);
      throw new NotFoundException(ErrorPayment.CustomerNotFound);
    }

    return customer.id;
  }

  public async createFiatPayment(
    customerId: string,
    dto: PaymentFiatCreateDto,
  ) {
    const { amount, currency } = dto;
    const paymentMethodOptions = {};

    const params: Stripe.PaymentIntentCreateParams = {
      payment_method_types: [PaymentFiatMethodType.CARD],
      amount: amount * 100,
      currency: currency,
    };

    params.confirm = true;
    params.customer = customerId;

    if (paymentMethodOptions) {
      params.payment_method_options = paymentMethodOptions;
    }

    const paymentIntent = await this.stripe.paymentIntents.create(params);

    return {
      clientSecret: paymentIntent.client_secret,
    };
  }

  public async confirmFiatPayment(
    userId: number,
    dto: PaymentFiatConfirmDto,
  ): Promise<boolean> {
    try {
      const paymentData = await this.getPayment(dto.paymentId);

      if (paymentData?.status?.toUpperCase() !== PaymentStatus.SUCCEEDED) {
        this.logger.log(ErrorPayment.NotSuccess, PaymentService.name);
        throw new NotFoundException(ErrorPayment.NotSuccess);
      }

      await this.savePayment(
        userId,
        PaymentSource.FIAT,
        PaymentType.DEPOSIT,
        BigNumber.from(paymentData.amount),
      );

      return true;
    } catch (e) {
      this.logger.log(ErrorPayment.NotFound, PaymentService.name);
      return false;
    }
  }

  public async createCryptoPayment(
    userId: number,
    dto: PaymentCryptoCreateDto,
  ) {
    try {
      const signer = this.ethersSigner.createWallet(
        this.configService.get<string>(
          'WEB3_JOB_LAUNCHER_PRIVATE_KEY',
          'web3 private key',
        ),
      );

      const transaction = await signer.provider.getTransactionReceipt(
        dto.transactionHash,
      );
      console.log(transaction);
      if (!transaction) {
        this.logger.error(ErrorPayment.TransactionNotFoundByHash);
        throw new NotFoundException(ErrorPayment.TransactionNotFoundByHash);
      }

      if (transaction.confirmations < TX_CONFIRMATION_TRESHOLD) {
        this.logger.error(
          `Transaction has ${transaction.confirmations} confirmations instead of ${TX_CONFIRMATION_TRESHOLD}`,
        );
        throw new NotFoundException(
          ErrorPayment.TransactionHasNotEnoughAmountOfConfirmations,
        );
      }

      await this.savePayment(
        userId,
        PaymentSource.CRYPTO,
        PaymentType.DEPOSIT,
        BigNumber.from(dto.amount),
      );

      return true;
    } catch (e) {
      this.logger.log(ErrorPayment.NotFound, PaymentService.name);
      return false;
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

  private async getPayment(
    paymentId: string,
  ): Promise<Stripe.Response<Stripe.PaymentIntent>> {
    return this.stripe.paymentIntents.retrieve(paymentId);
  }

  public async getUserBalance(userId: number): Promise<BigNumber> {
    const paymentEntities = await this.paymentRepository.find({ userId });

    let finalAmount = BigNumber.from(0);

    paymentEntities.forEach(payment => {
      if (payment.type === PaymentType.WITHDRAWAL) {
        BigNumber.from(finalAmount).sub(payment.amount);
      } else {
        BigNumber.from(finalAmount).add(payment.amount);
      }
    });

    return finalAmount;
  }
}
