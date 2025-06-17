import { PaymentEntity } from './payment.entity';
import { VatType } from '../../common/enums/payment';

export interface ListResult {
  entities: PaymentEntity[];
  itemCount: number;
}

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  default: boolean;
}

export interface BillingAddress {
  line1?: string;
  city?: string;
  country?: string;
  postal_code?: string;
}

export interface CustomerData {
  email: string;
  name?: string;
  address?: BillingAddress;
  default_payment_method?: string;
}

export interface TaxId {
  id: string;
  type: VatType;
  value: string;
}

export interface Invoice {
  id: string;
  payment_intent: string | null;
  status?: string;
  amount_due: number;
  currency: string;
}

export interface SetupIntent {
  customer: string;
  payment_method: string;
}

export interface PaymentIntent {
  customer: string;
  id: string;
  client_secret: string;
  status: string;
  amount: number;
  amount_received: number;
  currency: string;
  latest_charge: string;
}
