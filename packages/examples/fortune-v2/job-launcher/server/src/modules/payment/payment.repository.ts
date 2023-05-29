import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindConditions, FindManyOptions, FindOneOptions, Repository } from "typeorm";
import { PaymentEntity } from "./payment.entity";
import { ErrorPayment } from "../../common/constants/errors";
import { PaymentCreateDto, PaymentUpdateDto } from "./payment.dto";

@Injectable()
export class PaymentRepository {
  private readonly logger = new Logger(PaymentRepository.name);

  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentEntityRepository: Repository<PaymentEntity>,
  ) {}

  public async updateOne(
    where: FindConditions<PaymentEntity>,
    dto: Partial<PaymentUpdateDto>,
  ): Promise<PaymentEntity> {
    const jobEntity = await this.paymentEntityRepository.findOne(where);

    if (!jobEntity) {
      this.logger.log(ErrorPayment.NotFound, PaymentRepository.name);
      throw new NotFoundException(ErrorPayment.NotFound);
    }

    Object.assign(jobEntity, dto);
    return jobEntity.save();
  }

  public async findOne(
    where: FindConditions<PaymentEntity>,
    options?: FindOneOptions<PaymentEntity>,
  ): Promise<PaymentEntity> {
    const paymentEntity = await this.paymentEntityRepository.findOne({ where, ...options });

    if (!paymentEntity) {
      this.logger.log(ErrorPayment.NotFound, PaymentRepository.name);
      throw new NotFoundException(ErrorPayment.NotFound);
    }

    return paymentEntity;
  }
  
  public find(where: FindConditions<PaymentEntity>, options?: FindManyOptions<PaymentEntity>): Promise<PaymentEntity[]> {
    return this.paymentEntityRepository.find({
      where,
      order: {
        createdAt: "DESC",
      },
      ...options,
    });
  }

  public async create(dto: PaymentCreateDto): Promise<PaymentEntity> {
    return this.paymentEntityRepository
      .create(dto)
      .save();
  }
}
