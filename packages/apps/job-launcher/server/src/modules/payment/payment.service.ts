import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { BigNumber, FixedNumber, ethers, providers } from 'ethers';
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
import { HMToken, HMToken__factory } from '@human-protocol/core/typechain-types';
import { Web3Service } from '../web3/web3.service';
import { CoingeckoTokenId } from '../../common/constants/payment';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private stripe: Stripe;

  constructor(
    private readonly web3Service: Web3Service,
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
  ) {
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
  }

  public async confirmFiatPayment(
    userId: number,
    dto: PaymentFiatConfirmDto,
  ): Promise<boolean> {
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

      const rate = 1 / await this.currencyService.getRate(
        Currency.USD,
        paymentData.currency,
      );

      await this.savePayment(
        userId,
        PaymentSource.FIAT,
        paymentData.currency.toLowerCase(),
        PaymentType.DEPOSIT,
        BigNumber.from(paymentData.amount),
        rate
      );

    return true;
  }

  public async createCryptoPayment(
    userId: number,
    dto: PaymentCryptoCreateDto,
  ) {
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

    const amount = BigNumber.from(transaction.logs[0].data);
    const tokenAddress = transaction.logs[0].address;

    const signer = this.web3Service.getSigner(dto.chainId);
    const tokenContract: HMToken = HMToken__factory.connect(
      tokenAddress,
      signer
    );
    const tokenId = await tokenContract.symbol();

    if (!CoingeckoTokenId[tokenId]) {
      this.logger.log(
        ErrorPayment.UnsupportedToken,
        PaymentRepository.name,
      );
      throw new ConflictException(
        ErrorPayment.UnsupportedToken,
      );
    }

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

    const rate = await this.currencyService.getRate(
      CoingeckoTokenId[tokenId],
      Currency.USD,
    );

    await this.savePayment(
      userId,
      PaymentSource.CRYPTO,
      TokenId.HMT,
      PaymentType.DEPOSIT,
      amount,
      rate,
      transaction.transactionHash
    );

    return true;
    return true;
  }

  public async getPayment(
    paymentId: string,
  ): Promise<Stripe.Response<Stripe.PaymentIntent> | null> {
    return this.stripe.paymentIntents.retrieve(paymentId);
  }

  public async savePayment(
    userId: number,
    source: PaymentSource,
    currency: string,
    type: PaymentType,
    amount: BigNumber,
    rate: number,
    transactionHash?: string
  ): Promise<boolean> {
    const paymentEntity = await this.paymentRepository.create({
      userId,
      amount: amount.toString(),
      currency,
      source,
      rate,
      type,
      transactionHash
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
      const fixedAmount = FixedNumber.from(ethers.utils.formatUnits(payment.amount, 18));
      const rate = FixedNumber.from(payment.rate);

      const amount = BigNumber.from(fixedAmount.mulUnsafe(rate));

      if (payment.type === PaymentType.WITHDRAWAL) {
        finalAmount = finalAmount.sub(amount);
      } else {
        finalAmount = finalAmount.add(amount);
      }
    });
    
    return finalAmount;
  }
}
