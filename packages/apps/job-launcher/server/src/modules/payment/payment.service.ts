/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  HMToken,
  HMToken__factory,
} from '@human-protocol/core/typechain-types';
import { Injectable, Logger } from '@nestjs/common';
import { ethers, formatUnits } from 'ethers';
import { NetworkConfigService } from '../../common/config/network-config.service';
import { ServerConfigService } from '../../common/config/server-config.service';
import { TX_CONFIRMATION_TRESHOLD } from '../../common/constants';
import { ErrorPayment } from '../../common/constants/errors';
import { CoingeckoTokenId } from '../../common/constants/payment';
import {
  FiatCurrency,
  PaymentCurrency,
  PaymentSource,
  PaymentStatus,
  PaymentType,
  VatType,
} from '../../common/enums/payment';
import { add, div, eq, lt, mul } from '../../common/utils/decimal';
import { verifySignature } from '../../common/utils/signature';
import { Web3Service } from '../web3/web3.service';
import {
  AddressDto,
  BillingInfoDto,
  CardConfirmDto,
  CardDto,
  CurrencyBalanceDto,
  GetPaymentsDto,
  PaymentCryptoCreateDto,
  PaymentDto,
  PaymentFiatConfirmDto,
  PaymentFiatCreateDto,
  PaymentRefund,
  UserBalanceDto,
} from './payment.dto';
import { PaymentEntity } from './payment.entity';
import { PaymentRepository } from './payment.repository';

import { TOKEN_ADDRESSES } from '../../common/constants/tokens';
import { EscrowFundToken } from '../../common/enums/job';
import { ConflictError, NotFoundError, ServerError } from '../../common/errors';
import { PageDto } from '../../common/pagination/pagination.dto';
import { JobEntity } from '../job/job.entity';
import { JobRepository } from '../job/job.repository';
import { RateService } from '../rate/rate.service';
import { UserEntity } from '../user/user.entity';
import { UserRepository } from '../user/user.repository';
import { PaymentProvider } from './payment-provider.abstract';

@Injectable()
export class PaymentService {

  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly networkConfigService: NetworkConfigService,
    private readonly web3Service: Web3Service,
    private readonly paymentRepository: PaymentRepository,
    private readonly userRepository: UserRepository,
    private readonly jobRepository: JobRepository,
    private readonly serverConfigService: ServerConfigService,
    private readonly rateService: RateService,
    private readonly paymentProvider: PaymentProvider,
  ) {}

  public async createCustomerAndAssignCard(user: UserEntity): Promise<string> {
    let customerId = user.paymentProviderId;

    if (!customerId) {
      customerId = await this.paymentProvider.createCustomer(user.email);
    }

    return await this.paymentProvider.createSetupIntent(customerId);
  }

  public async confirmCard(
    user: UserEntity,
    data: CardConfirmDto,
  ): Promise<boolean> {
    const setup = await this.paymentProvider.retrieveSetupIntent(data.setupId);

    if (!setup) {
      this.logger.log(ErrorPayment.SetupNotFound, PaymentService.name);
      throw new NotFoundError(ErrorPayment.SetupNotFound);
    }

    let defaultPaymentMethod: string | null = null;
    if (!user.paymentProviderId) {
      user.paymentProviderId = setup.customer as string;
      await this.userRepository.updateOne(user);
    } else {
      defaultPaymentMethod = await this.getDefaultPaymentMethod(
        user.paymentProviderId,
      );
    }

    if (data.defaultCard || !defaultPaymentMethod) {
      await this.paymentProvider.updateCustomer(user.paymentProviderId, {
        default_payment_method: setup.payment_method as string,
      });
    }

    return true;
  }

  public async createFiatPayment(
    user: UserEntity,
    dto: PaymentFiatCreateDto,
  ): Promise<string> {
    const { amount, currency, paymentMethodId } = dto;
    const amountInCents = Math.ceil(mul(amount, 100));

    if (!user.paymentProviderId) {
      throw new NotFoundError(ErrorPayment.CustomerNotFound);
    }

    const invoice = await this.paymentProvider.createInvoice(
      user.paymentProviderId,
      amountInCents,
      currency,
      'Top up',
    );

    const paymentIntent = await this.paymentProvider.handlePaymentIntent(
      invoice.payment_intent as string,
      paymentMethodId,
      false, // on-session payment
    );

    // Check if the transaction already exists to prevent duplicates
    const paymentEntity = await this.paymentRepository.findOneByTransaction(
      paymentIntent.id,
    );

    if (paymentEntity) {
      throw new ConflictError(ErrorPayment.TransactionAlreadyExists);
    }

    const newPaymentEntity = new PaymentEntity();
    Object.assign(newPaymentEntity, {
      userId: user.id,
      source: PaymentSource.FIAT,
      type: PaymentType.DEPOSIT,
      amount: div(amountInCents, 100),
      currency,
      rate: 1,
      transaction: paymentIntent.id,
      status: PaymentStatus.PENDING,
    });

    await this.paymentRepository.createUnique(newPaymentEntity);

    return paymentIntent.client_secret!;
  }

  public async confirmFiatPayment(
    userId: number,
    data: PaymentFiatConfirmDto,
  ): Promise<boolean> {
    const paymentData = await this.paymentProvider.retrievePaymentIntent(
      data.paymentId,
    );

    if (!paymentData) {
      throw new NotFoundError(ErrorPayment.NotFound);
    }

    const paymentEntity = await this.paymentRepository.findOneByTransaction(
      data.paymentId,
    );

    // Validate payment details against the recorded transaction data.
    if (
      !paymentEntity ||
      paymentEntity.userId !== userId ||
      paymentEntity.status !== PaymentStatus.PENDING ||
      !eq(paymentEntity.amount, div(paymentData.amount_received, 100)) ||
      paymentEntity.currency !== paymentData.currency
    ) {
      throw new NotFoundError(ErrorPayment.NotFound);
    }

    if (
      paymentData.status === PaymentStatus.CANCELED ||
      paymentData.status === PaymentStatus.REQUIRES_PAYMENT_METHOD
    ) {
      paymentEntity.status = PaymentStatus.FAILED;
      await this.paymentRepository.updateOne(paymentEntity);

      throw new ConflictError(ErrorPayment.NotSuccess);
    } else if (paymentData.status !== PaymentStatus.SUCCEEDED) {
      return false; // TODO: Handling other cases
    }

    // Update the payment entity to reflect successful payment.
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
      throw new NotFoundError(ErrorPayment.TransactionNotFoundByHash);
    }

    verifySignature(dto, signature, [transaction.from]);

    if (!transaction.logs[0] || !transaction.logs[0].data) {
      throw new ServerError(ErrorPayment.InvalidTransactionData);
    }

    if ((await transaction.confirmations()) < TX_CONFIRMATION_TRESHOLD) {
      this.logger.error(
        `Transaction has ${transaction.confirmations} confirmations instead of ${TX_CONFIRMATION_TRESHOLD}`,
      );
      throw new ConflictError(
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
      throw new ConflictError(ErrorPayment.InvalidRecipient);
    }

    const tokenId = (await tokenContract.symbol()).toLowerCase();
    const token = TOKEN_ADDRESSES[dto.chainId]?.[tokenId as EscrowFundToken];

    if (token?.address !== tokenAddress || !CoingeckoTokenId[tokenId]) {
      throw new ConflictError(ErrorPayment.UnsupportedToken);
    }

    const amount = Number(
      formatUnits(transaction.logs[0].data, token.decimals),
    );

    const paymentEntity = await this.paymentRepository.findOneByTransaction(
      transaction.hash,
      dto.chainId,
    );

    if (paymentEntity) {
      throw new ConflictError(ErrorPayment.TransactionAlreadyExists);
    }

    const rate = await this.rateService.getRate(tokenId, FiatCurrency.USD);

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

  public async getUserBalanceByCurrency(
    userId: number,
    currency: string,
  ): Promise<number> {
    const paymentEntities = await this.paymentRepository.getUserBalancePayments(
      userId,
      currency,
    );

    return paymentEntities.reduce(
      (sum, payment) => add(sum, Number(payment.amount)),
      0,
    );
  }

  public async createRefundPayment(dto: PaymentRefund) {
    const rate = await this.rateService.getRate(
      dto.refundCurrency,
      FiatCurrency.USD,
    );

    const paymentEntity = new PaymentEntity();
    Object.assign(paymentEntity, {
      userId: dto.userId,
      jobId: dto.jobId,
      source: PaymentSource.BALANCE,
      type: PaymentType.REFUND,
      amount: dto.refundAmount,
      currency: dto.refundCurrency,
      rate,
      status: PaymentStatus.SUCCEEDED,
    });
    await this.paymentRepository.createUnique(paymentEntity);
  }

  public async convertToUSD(amount: number, currency: string): Promise<number> {
    if (currency === FiatCurrency.USD) {
      return amount;
    }
    const rate = await this.rateService.getRate(currency, FiatCurrency.USD);
    return mul(amount, rate);
  }

  public async createSlash(job: JobEntity): Promise<void> {
    const amount = this.serverConfigService.abuseAmount;
    const currency = PaymentCurrency.USD;

    const user = await this.userRepository.findById(job.userId);
    if (!user || !user.paymentProviderId) {
      throw new NotFoundError(ErrorPayment.CustomerNotFound);
    }

    const amountInCents = Math.ceil(mul(amount, 100));
    const invoice = await this.paymentProvider.createInvoice(
      user.paymentProviderId,
      amountInCents,
      currency,
      'Slash Job Id ' + job.id,
    );

    const defaultPaymentMethod = await this.getDefaultPaymentMethod(
      user.paymentProviderId,
    );

    if (!defaultPaymentMethod) {
      throw new ServerError(ErrorPayment.NotDefaultPaymentMethod);
    }

    const paymentIntent = await this.paymentProvider.handlePaymentIntent(
      invoice.payment_intent as string,
      defaultPaymentMethod,
      true, // off-session payment
    );

    const newPaymentEntity = new PaymentEntity();
    Object.assign(newPaymentEntity, {
      userId: job.userId,
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
      userId: job.userId,
      source: PaymentSource.BALANCE,
      type: PaymentType.SLASH,
      amount: div(-amountInCents, 100),
      currency,
      rate: 1,
      transaction: null,
      status: PaymentStatus.SUCCEEDED,
      jobId: job.id,
    });

    await this.paymentRepository.createUnique(newPaymentEntity);
  }

  public async createWithdrawalPayment(
    userId: number,
    amount: number,
    currency: string,
    rate: number,
  ): Promise<PaymentEntity> {
    // Check if the user has enough balance
    const userBalance = await this.getUserBalanceByCurrency(userId, currency);
    if (lt(userBalance, amount)) {
      throw new ServerError(ErrorPayment.NotEnoughFunds);
    }

    const paymentEntity = new PaymentEntity();
    paymentEntity.userId = userId;
    paymentEntity.source = PaymentSource.BALANCE;
    paymentEntity.type = PaymentType.WITHDRAWAL;
    paymentEntity.amount = -amount; // In the currency used for the payment.
    paymentEntity.currency = currency;
    paymentEntity.rate = rate;
    paymentEntity.status = PaymentStatus.SUCCEEDED;

    return this.paymentRepository.createUnique(paymentEntity);
  }

  async listUserPaymentMethods(user: UserEntity): Promise<CardDto[]> {
    const cards: CardDto[] = [];
    if (!user.paymentProviderId) {
      return cards;
    }

    // List all the payment methods (cards) associated with the user's account
    const paymentMethods = await this.paymentProvider.listPaymentMethods(
      user.paymentProviderId,
    );

    const defaultPaymentMethod = await this.getDefaultPaymentMethod(
      user.paymentProviderId,
    );

    for (const paymentMethod of paymentMethods) {
      const card = new CardDto();
      card.id = paymentMethod.id;
      card.brand = paymentMethod.brand;
      card.last4 = paymentMethod.last4;
      card.expMonth = paymentMethod.expMonth;
      card.expYear = paymentMethod.expYear;
      card.default = defaultPaymentMethod === paymentMethod.id;
      cards.push(card);
    }
    return cards;
  }

  async deletePaymentMethod(user: UserEntity, paymentMethodId: string) {
    // Retrieve the payment method to be detached
    const paymentMethod =
      await this.paymentProvider.retrievePaymentMethod(paymentMethodId);

    // Check if the payment method is the default one and in use for the user
    if (
      user.paymentProviderId &&
      paymentMethod.id ===
        (await this.getDefaultPaymentMethod(user.paymentProviderId)) &&
      (await this.isPaymentMethodInUse(user.id))
    ) {
      throw new ConflictError(ErrorPayment.PaymentMethodInUse);
    }

    // Detach the payment method from the user's account
    return this.paymentProvider.detachPaymentMethod(paymentMethodId);
  }

  async getUserBillingInfo(user: UserEntity): Promise<BillingInfoDto | null> {
    if (!user.paymentProviderId) {
      return null;
    }

    const taxIds = await this.paymentProvider.listCustomerTaxIds(
      user.paymentProviderId,
    );

    const customer = await this.paymentProvider.retrieveCustomer(
      user.paymentProviderId,
    );

    const userBillingInfo = new BillingInfoDto();
    if (customer.address) {
      const address = new AddressDto();
      address.country = (customer.address.country as string).toLowerCase();
      address.postalCode = customer.address.postal_code as string;
      address.city = customer.address.city as string;
      address.line = customer.address.line1 as string;
      userBillingInfo.address = address;
    }
    userBillingInfo.name = customer.name as string;
    userBillingInfo.email = customer.email as string;
    userBillingInfo.vat = taxIds[0]?.value;
    userBillingInfo.vatType = taxIds[0]?.type as VatType;
    return userBillingInfo;
  }

  async updateUserBillingInfo(
    user: UserEntity,
    updateBillingInfoDto: BillingInfoDto,
  ) {
    if (!user.paymentProviderId) {
      throw new NotFoundError(ErrorPayment.CustomerNotFound);
    }

    const existingTaxIds = await this.paymentProvider.listCustomerTaxIds(
      user.paymentProviderId,
    );

    // Delete any existing tax IDs before adding the new one
    for (const taxId of existingTaxIds) {
      await this.paymentProvider.deleteTaxId(user.paymentProviderId, taxId.id);
    }

    // Create the new VAT tax ID
    if (updateBillingInfoDto.vat && updateBillingInfoDto.vatType) {
      await this.paymentProvider.createTaxId(
        user.paymentProviderId,
        updateBillingInfoDto.vatType,
        updateBillingInfoDto.vat,
      );
    }

    // If there are changes to the address, name, or email, update them
    if (
      updateBillingInfoDto.address ||
      updateBillingInfoDto.name ||
      updateBillingInfoDto.email
    ) {
      return this.paymentProvider.updateCustomer(user.paymentProviderId, {
        address: {
          line1: updateBillingInfoDto.address?.line,
          city: updateBillingInfoDto.address?.city,
          country: updateBillingInfoDto.address?.country,
          postal_code: updateBillingInfoDto.address?.postalCode,
        },
        name: updateBillingInfoDto.name,
        email: updateBillingInfoDto.email,
      });
    }
  }

  async changeDefaultPaymentMethod(user: UserEntity, cardId: string) {
    if (!user.paymentProviderId) {
      throw new NotFoundError(ErrorPayment.CustomerNotFound);
    }

    return this.paymentProvider.updateCustomer(user.paymentProviderId, {
      default_payment_method: cardId,
    });
  }

  async getDefaultPaymentMethod(customerId: string): Promise<string | null> {
    if (!customerId) {
      throw new NotFoundError(ErrorPayment.CustomerNotFound);
    }

    return await this.paymentProvider.getDefaultPaymentMethod(customerId);
  }

  private async isPaymentMethodInUse(userId: number): Promise<boolean> {
    // Check if the payment method is currently in use by any active jobs
    return (
      (
        await this.jobRepository.findActiveByUserAndPaymentSource(
          userId,
          PaymentSource.FIAT,
        )
      ).length > 0
    );
  }

  public async getAllPayments(
    data: GetPaymentsDto,
    userId: number,
  ): Promise<PageDto<PaymentDto>> {
    const { entities, itemCount } = await this.paymentRepository.fetchFiltered(
      data,
      userId,
    );

    const payments: PaymentDto[] = entities.map((payment) => {
      return {
        amount: payment.amount,
        rate: payment.rate,
        currency: payment.currency,
        type: payment.type,
        source: payment.source,
        status: payment.status,
        transaction: payment.transaction,
        createdAt: payment.createdAt.toISOString(),
        jobId: payment.jobId ?? undefined,
        escrowAddress: payment.job?.escrowAddress ?? undefined,
      };
    });

    return new PageDto(data.page!, data.pageSize!, itemCount, payments);
  }

  async getReceipt(paymentId: string, user: UserEntity): Promise<string> {
    const paymentIntent =
      await this.paymentProvider.retrievePaymentIntent(paymentId);

    if (!paymentIntent || paymentIntent.customer !== user.paymentProviderId) {
      throw new NotFoundError(ErrorPayment.NotFound);
    }

    const charge = await this.paymentProvider.retrieveCharge(
      paymentIntent.latest_charge as string,
    );

    if (!charge || !charge.receipt_url) {
      throw new NotFoundError(ErrorPayment.NotFound);
    }

    return charge.receipt_url;
  }

  public async getUserBalance(userId: number): Promise<UserBalanceDto> {
    const balances: CurrencyBalanceDto[] = [];
    let totalUSDAmount = 0;

    for (const currency of Object.values(PaymentCurrency)) {
      const amount = await this.getUserBalanceByCurrency(userId, currency);
      const amountInUSD = await this.convertToUSD(amount, currency);
      totalUSDAmount = add(totalUSDAmount, amountInUSD);
      balances.push({ currency, amount });
    }

    return {
      balances,
      totalUsdAmount: totalUSDAmount,
    };
  }
}
