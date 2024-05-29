import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { ethers } from 'ethers';
import { ErrorPayment } from '../../common/constants/errors';
import { PaymentRepository } from './payment.repository';
import {
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

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private stripe: Stripe;

  constructor(
    private readonly networkConfigService: NetworkConfigService,
    private readonly web3Service: Web3Service,
    private readonly paymentRepository: PaymentRepository,
    private stripeConfigService: StripeConfigService,
    private rateService: RateService,
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

  public async createFiatPayment(
    userId: number,
    dto: PaymentFiatCreateDto,
  ): Promise<string> {
    const { amount, currency } = dto;

    const amountInCents = Math.ceil(mul(amount, 100));
    const params: Stripe.PaymentIntentCreateParams = {
      amount: amountInCents,
      currency: currency,
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
      userId,
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
}
