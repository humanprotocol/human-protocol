export enum Currency {
  USD = 'usd',
  AED = 'aed',
  ARS = 'ars',
  AUD = 'aud',
  BDT = 'bdt',
  BMD = 'bmd',
  BRL = 'brl',
  CAD = 'cad',
  CHF = 'chf',
  CLP = 'clp',
  CNY = 'cny',
  CZK = 'czk',
  DKK = 'dkk',
  EUR = 'eur',
  GBP = 'gbp',
  HKD = 'hkd',
  HUF = 'huf',
  IDR = 'idr',
  ILS = 'ils',
  INR = 'inr',
  JPY = 'jpy',
  KRW = 'krw',
  LKR = 'lkr',
  MMK = 'mmk',
  MXN = 'mxn',
  MYR = 'myr',
  NGN = 'ngn',
  NOK = 'nok',
  NZD = 'nzd',
  PHP = 'php',
  PKR = 'pkr',
  PLN = 'pln',
  RUB = 'rub',
  SAR = 'sar',
  SEK = 'sek',
  SGD = 'sgd',
  THB = 'thb',
  TRY = 'try',
  TWD = 'twd',
  UAH = 'uah',
  VND = 'vnd',
  ZAR = 'zar',
}

export enum TokenId {
  HMT = 'hmt',
  USDT = 'usdt',
}

export enum PaymentSource {
  FIAT = 'fiat',
  CRYPTO = 'crypto',
  BALANCE = 'balance',
}

export enum PaymentFiatMethodType {
  CARD = 'card',
}

export enum PaymentType {
  DEPOSIT = 'deposit',
  REFUND = 'refund',
  WITHDRAWAL = 'withdrawal',
  SLASH = 'slash',
}

export enum PaymentStatus {
  PENDING = 'pending',
  FAILED = 'failed',
  SUCCEEDED = 'succeeded',
}

export enum StripePaymentStatus {
  CANCELED = 'canceled',
  REQUIRES_PAYMENT_METHOD = 'requires_payment_method',
  SUCCEEDED = 'succeeded',
}
