import { PaymentEntity } from './payment.entity';

export interface ListResult {
  entities: PaymentEntity[];
  itemCount: number;
}
