import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import Stripe from "stripe";
import { Repository } from "typeorm";
import * as errors from "../common/constants/errors";
import { Currency, MethodType, PaymentStatus, PaymentType } from "../common/enums/currencies";
import { IPaymentConfirmDto, IPaymentCreateDto } from "./interfaces";
import { PaymentEntity } from "./payment.entity";

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private stripe: Stripe;
  private endpointSecrete: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(PaymentEntity)
    private readonly paymentEntityRepository: Repository<PaymentEntity>,
  ) {
    this.stripe = new Stripe(this.configService.get("STRIPE_SECRET_KEY", "secrete-key"), {
      apiVersion: this.configService.get("STRIPE_API_VERSION", "2022-11-15"),
      appInfo: {
        name: this.configService.get("NAME", "Fortune"),
        version: this.configService.get("VERSION"),
        url: this.configService.get("STRIPE_APP_INFO_URL"),
      },
    });
    this.endpointSecrete = this.configService.get("STRIPE_ENDPOINT_SECRETE", "secrete-key");
  }

  public async createCustomer(email: string) {
    const customer = await this.stripe.customers.create({
      email,
    });

    if (!customer) {
      this.logger.log(errors.Payment.CustomerNotFound, PaymentService.name);
      throw new NotFoundException(errors.Payment.CustomerNotFound);
    }

    return customer.id;
  }

  public async createPaymentIntent(customerId: string, dto: IPaymentCreateDto) {
    const { amount, currency, paymentMethodType } = dto;
    const paymentMethodOptions = {};

    const params: Stripe.PaymentIntentCreateParams = {
      payment_method_types: [paymentMethodType],
      amount: amount * 100,
      currency: currency,
    };

    if (paymentMethodType === "acss_debit") {
      params.payment_method_options = {
        acss_debit: {
          mandate_options: {
            payment_schedule: "sporadic",
            transaction_type: "personal",
          },
        },
      };
    } else if (paymentMethodType === "konbini") {
      params.payment_method_options = {
        konbini: {
          product_description: "Tシャツ",
          expires_after_days: 3,
        },
      };
    } else if (paymentMethodType === "customer_balance") {
      params.payment_method_data = {
        type: "customer_balance",
      };
      params.confirm = true;
      params.customer = customerId;
    }

    if (paymentMethodOptions) {
      params.payment_method_options = paymentMethodOptions;
    }

    const paymentIntent = await this.stripe.paymentIntents.create(params);

    return {
      clientSecret: paymentIntent.client_secret
    };
  }

  public async confirmPayment(userId: number, dto: IPaymentConfirmDto): Promise<boolean> {
    try {
      const paymentData = await this.getPayment(dto.paymentId);

      if (paymentData?.status?.toUpperCase() !== PaymentStatus.SUCCEEDED) {
        this.logger.log(errors.Payment.NotSuccess, PaymentService.name);
        throw new NotFoundException(errors.Payment.NotSuccess);
      }

      await this.savePayment(userId, PaymentType.DEPOSIT, paymentData.amount)

      return true;
    } catch (e) {
      this.logger.log(errors.Payment.NotFound, PaymentService.name);
      return false;
    }
  }

  public async savePayment(userId: number, type: PaymentType, amount: number): Promise<boolean> {
    const paymentEntity = await this.paymentEntityRepository
      .create({
        userId,
        amount: amount,
        currency: Currency.USD,
        rate: 1, // TODO: Implement the rate when depositing in other currencies
        type,
      })
      .save();

    if (!paymentEntity) {
      this.logger.log(errors.Payment.NotFound, PaymentService.name);
      throw new NotFoundException(errors.Payment.NotFound);
    }

    return true;
  }

  private async getPayment(paymentId: string): Promise<Stripe.Response<Stripe.PaymentIntent>> {
    return this.stripe.paymentIntents.retrieve(paymentId);
  }

  public async getUserBalance(userId: number): Promise<number> {
    const paymentEntities = await this.paymentEntityRepository.find({ userId });

    let finalAmount = 0;
    
    paymentEntities.forEach(payment => {
      if(payment.type === PaymentType.WITHDRAWAL) {
        finalAmount -= payment.amount
      } else {
        finalAmount += payment.amount
      }
    })

    return finalAmount;
  }
}
