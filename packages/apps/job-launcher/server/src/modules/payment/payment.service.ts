import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { BigNumber, FixedNumber, ethers, providers } from 'ethers';
import { ErrorPayment } from '../../common/constants/errors';
import { PaymentRepository } from './payment.repository';
import {
  PaymentCryptoCreateDto,
  PaymentFiatConfirmDto,
  PaymentFiatCreateDto,
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
import { ConfigNames, networkMap } from '../../common/config';
import {
  HMToken,
  HMToken__factory,
} from '@human-protocol/core/typechain-types';
import { Web3Service } from '../web3/web3.service';
import { CoingeckoTokenId } from '../../common/constants/payment';
import { getRate } from '../../common/utils';
import { UserEntity } from '../user/user.entity';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private stripe: Stripe;

  constructor(
    private readonly web3Service: Web3Service,
    private readonly paymentRepository: PaymentRepository,
    private configService: ConfigService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>(ConfigNames.STRIPE_SECRET_KEY)!,
      {
        apiVersion: this.configService.get<any>(
          ConfigNames.STRIPE_API_VERSION,
        )!,
        appInfo: {
          name: this.configService.get<string>(
            ConfigNames.STRIPE_APP_NAME,
            'Fortune',
          )!,
          version: this.configService.get<string>(
            ConfigNames.STRIPE_APP_VERSION,
          )!,
          url: this.configService.get<string>(ConfigNames.STRIPE_APP_INFO_URL)!,
        },
      },
    );
  }

  public async createFiatPayment(
    userId: number,
    dto: PaymentFiatCreateDto,
  ): Promise<string> {
    const { amount, currency } = dto;

    const params: Stripe.PaymentIntentCreateParams = {
      amount: amount * 100,
      currency: currency,
    };

    const paymentIntent = await this.stripe.paymentIntents.create(params);

    if (!paymentIntent.client_secret) {
      this.logger.log(
        ErrorPayment.ClientSecretDoesNotExist,
        PaymentService.name,
      );
      throw new NotFoundException(ErrorPayment.ClientSecretDoesNotExist);
    }

    const paymentEntity = await this.paymentRepository.findOne({
      transaction: paymentIntent.client_secret,
    });

    if (paymentEntity) {
      this.logger.log(
        ErrorPayment.TransactionAlreadyExists,
        PaymentRepository.name,
      );
      throw new BadRequestException(ErrorPayment.TransactionAlreadyExists);
    }

    const rate = await getRate(Currency.USD, currency);
    
    await this.paymentRepository.create({
      userId,
      source: PaymentSource.FIAT,
      type: PaymentType.DEPOSIT,
      amount: amount.toString(),
      currency,
      rate,
      transaction: paymentIntent.client_secret,
      status: PaymentStatus.PENDING,
    })

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

    const paymentEntity = await this.paymentRepository.findOne({
      userId,
      transaction: data.paymentId,
      status: PaymentStatus.PENDING
    });

    if (!paymentEntity) {
      this.logger.log(
        ErrorPayment.NotFound,
        PaymentRepository.name,
      );
      throw new BadRequestException(ErrorPayment.NotFound);
    }

    if (paymentData?.status === StripePaymentStatus.CANCELED || 
        paymentData?.status === StripePaymentStatus.REQUIRES_PAYMENT_METHOD) {
      paymentEntity.status = PaymentStatus.FAILED;
      await paymentEntity.save();
      this.logger.log(ErrorPayment.NotSuccess, PaymentService.name);
      throw new BadRequestException(ErrorPayment.NotSuccess);
    } else if (paymentData?.status !== StripePaymentStatus.SUCCEEDED) {
      return false; // TODO: Handling other cases
    }

    paymentEntity.status = PaymentStatus.SUCCEEDED;
    await paymentEntity.save();

    return true;
  }

  public async createCryptoPayment(
    userId: number,
    dto: PaymentCryptoCreateDto,
  ): Promise<boolean> {
    this.web3Service.validateChainId(dto.chainId);

    const provider = new providers.JsonRpcProvider(
      Object.values(networkMap).find(
        (item) => item.chainId === dto.chainId,
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

    const signer = this.web3Service.getSigner(dto.chainId);

    const recepientAddress = transaction.logs[0].topics.some(
      (topic) =>
        ethers.utils.hexValue(topic) === ethers.utils.hexValue(signer.address),
    );
    if (!recepientAddress) {
      this.logger.error(ErrorPayment.InvalidRecipient);
      throw new ConflictException(ErrorPayment.InvalidRecipient);
    }

    const amount = BigNumber.from(transaction.logs[0].data);
    const tokenAddress = transaction.logs[0].address;

    const tokenContract: HMToken = HMToken__factory.connect(
      tokenAddress,
      signer,
    );
    const tokenId = (await tokenContract.symbol()).toLowerCase();

    if (!CoingeckoTokenId[tokenId]) {
      this.logger.log(ErrorPayment.UnsupportedToken, PaymentRepository.name);
      throw new ConflictException(ErrorPayment.UnsupportedToken);
    }

    const paymentEntity = await this.paymentRepository.findOne({
      transaction: transaction.transactionHash,
    });

    if (paymentEntity) {
      this.logger.log(
        ErrorPayment.TransactionAlreadyExists,
        PaymentRepository.name,
      );
      throw new BadRequestException(ErrorPayment.TransactionAlreadyExists);
    }

    const rate = await getRate(Currency.USD, TokenId.HMT);
    
    await this.paymentRepository.create({
      userId,
      source: PaymentSource.CRYPTO,
      type: PaymentType.DEPOSIT,
      amount: amount.toString(),
      currency: TokenId.HMT,
      rate,
      chainId: dto.chainId,
      transaction: dto.transactionHash,
      status: PaymentStatus.SUCCEEDED,
    })

    return true;
  }

  

  public async getUserBalance(userId: number): Promise<BigNumber> {
    const paymentEntities = await this.paymentRepository.find({ userId });

    let finalAmount = BigNumber.from(0);

    paymentEntities.forEach((payment) => {
      const fixedAmount = FixedNumber.from(
        ethers.utils.formatUnits(payment.amount, 18),
      );
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