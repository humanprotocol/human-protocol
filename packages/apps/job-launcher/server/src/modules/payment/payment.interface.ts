import { PaymentEntity } from './payment.entity';
import { PaymentStatus, VatType } from '../../common/enums/payment';

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
  postalCode?: string;
}

export interface CustomerData {
  email: string;
  name?: string;
  address?: BillingAddress;
  defaultPaymentMethod?: string;
}

export interface TaxId {
  id: string;
  type: VatType;
  value: string;
}

export interface Invoice {
  id: string;
  paymentId: string | null;
  status?: string;
  amountDue: number;
  currency: string;
}

export interface CardSetup {
  customerId: string;
  paymentMethod: string;
}

export interface PaymentData {
  customer: string;
  id: string;
  clientSecret: string | null;
  status: PaymentStatus | null;
  amount: number;
  amountReceived: number;
  currency: string;
  latestCharge: string;
}
